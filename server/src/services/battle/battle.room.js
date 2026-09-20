import { redisClient, BATTLE_KEYS } from "./battle.redis.js";

// Utility abstraction around Redis for Battle Rooms
export class BattleRoomStore {
  static async createRoom(roomData) {
    const { roomId, hostParticipantId, problemIds, maxPlayers, durationMinutes = 30 } = roomData;
    const roomKey = BATTLE_KEYS.room(roomId);
    
    // Create the room hash
    await redisClient.hset(roomKey, {
      roomId,
      hostParticipantId,
      problemIds: JSON.stringify(problemIds),
      maxPlayers: maxPlayers.toString(),
      durationMinutes: durationMinutes.toString(),
      status: "WAITING",
      createdAt: Date.now().toString(),
      startedAt: "",
      finishedAt: "",
    });
    
    // Set TTL for WAITING rooms (e.g. 15 minutes = 900s)
    await redisClient.expire(roomKey, 900);
    
    // Add to waiting index
    await redisClient.sadd(BATTLE_KEYS.waitingRooms(), roomId);
    
    return this.getRoom(roomId);
  }

  static async getRoom(roomId) {
    const roomKey = BATTLE_KEYS.room(roomId);
    const room = await redisClient.hgetall(roomKey);
    
    if (!room || !room.roomId) return null;
    
    return {
      ...room,
      problemIds: room.problemIds ? JSON.parse(room.problemIds) : [],
      maxPlayers: parseInt(room.maxPlayers, 10),
      durationMinutes: parseInt(room.durationMinutes || "30", 10),
      createdAt: parseInt(room.createdAt, 10),
      startedAt: room.startedAt ? parseInt(room.startedAt, 10) : null,
      finishedAt: room.finishedAt ? parseInt(room.finishedAt, 10) : null,
    };
  }

  static async getPlayers(roomId) {
    const playersKey = BATTLE_KEYS.roomPlayers(roomId);
    const participantIds = await redisClient.smembers(playersKey);
    
    if (!participantIds.length) return [];
    
    // Fetch metadata for all players
    const players = [];
    for (const pid of participantIds) {
      const playerKey = BATTLE_KEYS.player(roomId, pid);
      const metaStr = await redisClient.get(playerKey);
      if (metaStr) {
        players.push(JSON.parse(metaStr));
      }
    }
    
    return players;
  }
  
  static async updatePlayer(roomId, participantId, updates) {
    const playerKey = BATTLE_KEYS.player(roomId, participantId);
    const metaStr = await redisClient.get(playerKey);
    if (!metaStr) return null;
    
    const player = JSON.parse(metaStr);
    const updated = { ...player, ...updates };
    await redisClient.set(playerKey, JSON.stringify(updated));
    return updated;
  }

  static async leaveRoom(roomId, participantId, uuid) {
    const playersKey = BATTLE_KEYS.roomPlayers(roomId);
    const playerKey = BATTLE_KEYS.player(roomId, participantId);
    const userMapKey = BATTLE_KEYS.userParticipantMap(uuid);
    
    // Remove from set and delete meta
    await redisClient.srem(playersKey, participantId);
    await redisClient.del(playerKey);
    
    // Free up the active battle lock for the user
    await redisClient.del(userMapKey);
    
    // Update room status if it was READY and now it dropped below maxPlayers
    // Or just leave it as is and let the host manage (or node manage)
    const room = await this.getRoom(roomId);
    if (room && room.status === "READY") {
      const currentCount = await redisClient.scard(playersKey);
      if (currentCount < room.maxPlayers) {
        await redisClient.hset(BATTLE_KEYS.room(roomId), "status", "WAITING");
        await redisClient.sadd(BATTLE_KEYS.waitingRooms(), roomId);
      }
    }
  }
  
  static async joinRoomAtomic(roomId, participantId, uuid, maxPlayers, playerMeta) {
    const roomKey = BATTLE_KEYS.room(roomId);
    const playersKey = BATTLE_KEYS.roomPlayers(roomId);
    const playerKey = BATTLE_KEYS.player(roomId, participantId);
    const userMapKey = BATTLE_KEYS.userParticipantMap(uuid);
    
    const resultStr = await redisClient.atomicJoinRoom(
      roomKey, playersKey, playerKey, userMapKey,
      participantId, roomId, maxPlayers, JSON.stringify(playerMeta)
    );
    
    return JSON.parse(resultStr);
  }
  
  static async updateRoomStatus(roomId, status) {
    const roomKey = BATTLE_KEYS.room(roomId);
    await redisClient.hset(roomKey, "status", status);
    
    if (status !== "WAITING") {
      await redisClient.srem(BATTLE_KEYS.waitingRooms(), roomId);
    }
    
    if (status === "ACTIVE") {
      await redisClient.hset(roomKey, "startedAt", Date.now().toString());
      // Set longer TTL for active battles (e.g. 45 mins)
      await redisClient.expire(roomKey, 2700);
    } else if (status === "FINISHED") {
      await redisClient.hset(roomKey, "finishedAt", Date.now().toString());
      // Set short TTL for finished battles
      await redisClient.expire(roomKey, 600);
    }
  }

  static async updateRoomStatusIfActive(roomId, newStatus) {
    const roomKey = BATTLE_KEYS.room(roomId);
    
    const luaScript = `
      local status = redis.call("HGET", KEYS[1], "status")
      if status == "ACTIVE" then
        redis.call("HSET", KEYS[1], "status", ARGV[1])
        if ARGV[1] == "FINISHED" or ARGV[1] == "EXPIRED" or ARGV[1] == "ABANDONED" then
          redis.call("HSET", KEYS[1], "finishedAt", ARGV[2])
          redis.call("EXPIRE", KEYS[1], 600)
        end
        return 1
      end
      return 0
    `;
    
    const result = await redisClient.eval(luaScript, 1, roomKey, newStatus, Date.now().toString());
    
    if (result === 1) {
      if (newStatus !== "WAITING") {
        await redisClient.srem(BATTLE_KEYS.waitingRooms(), roomId);
      }
      return true;
    }
    return false;
  }

  static async updatePlayerScore(roomId, participantId, problemId, newScore) {
    const playerKey = BATTLE_KEYS.player(roomId, participantId);
    const metaStr = await redisClient.get(playerKey);
    if (!metaStr) return null;
    
    const player = JSON.parse(metaStr);
    const scores = player.scores || {};
    
    const previousScore = scores[problemId] || 0;
    
    // Only update if the new score is strictly better than the previous
    if (newScore > previousScore) {
      scores[problemId] = newScore;
      
      const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
      
      const updated = {
        ...player,
        scores,
        totalScore,
        scoreAchievedAt: Date.now()
      };
      
      await redisClient.set(playerKey, JSON.stringify(updated));
      return updated;
    }
    
    return player;
  }
}
