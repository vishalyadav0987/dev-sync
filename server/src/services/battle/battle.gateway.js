import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, redisSubClient } from "./battle.redis.js";
import { BattleRoomStore } from "./battle.room.js";
import { BattleService } from "./battle.service.js";
import { getOrCreateParticipant } from "../chat/chat.service.js";
import { BATTLE_KEYS } from "./battle.redis.js";

const RATE_LIMIT_WINDOW = 60; // 1 minute
const MAX_SUBMISSIONS_PER_MINUTE = 5;
const MAX_RUNS_PER_MINUTE = 10;

export function setupBattleGateway(io) {
  io.adapter(createAdapter(redisClient, redisSubClient));

  const battleNamespace = io.of("/battle");

  battleNamespace.on("connection", (socket) => {
    socket.battleParticipant = null;
    socket.battleRoom = null;
    socket.battleUuid = null;

    socket.on("battle:join", async (payload, callback) => {
      try {
        const { uuid, roomId } = payload;
        if (!uuid || !roomId) return callback && callback({ error: "Missing uuid or roomId" });

        const participant = await getOrCreateParticipant(uuid);
        const room = await BattleRoomStore.getRoom(roomId);

        if (!room) return callback && callback({ error: "Battle not found" });

        // Build participant metadata for battle
        const playerMeta = {
          participantId: participant.participantId,
          uuid,
          displayName: participant.displayName,
          avatar: participant.avatar,
          team: null, // Will assign if 2v2
          status: "CONNECTED",
          ready: false,
          joinedAt: Date.now(),
          solvedProblems: []
        };

        const joinResult = await BattleRoomStore.joinRoomAtomic(
          roomId,
          participant.participantId,
          uuid,
          room.maxPlayers,
          playerMeta
        );

        if (!joinResult.success) {
          // If the reason is ALREADY_JOINED, we can still let them reconnect
          if (joinResult.message !== "ALREADY_JOINED") {
            return callback && callback({ error: joinResult.reason || "Failed to join" });
          }
          
          // If ALREADY_JOINED, update their status to CONNECTED
          await BattleRoomStore.updatePlayer(roomId, participant.participantId, { status: "CONNECTED" });
        } else if (joinResult.success && joinResult.playerCount) {
           // Assign team if 2v2
           if (room.mode === "2v2") {
             const team = joinResult.playerCount <= 2 ? "A" : "B";
             await BattleRoomStore.updatePlayer(roomId, participant.participantId, { team });
           }
        }

        const socketRoom = `battle:${roomId}`;
        socket.join(socketRoom);
        
        socket.battleParticipant = participant;
        socket.battleRoom = roomId;
        socket.battleUuid = uuid;

        const updatedRoom = await BattleRoomStore.getRoom(roomId);
        const players = await BattleRoomStore.getPlayers(roomId);

        // Notify room
        battleNamespace.to(socketRoom).emit("battle:player-joined", {
          players,
          room: updatedRoom,
          joinedParticipant: { displayName: participant.displayName, status: "CONNECTED", uuid },
          currentPlayers: players.length,
          maxPlayers: updatedRoom.maxPlayers
        });

        // Notify global battle namespace about waiting room update
        battleNamespace.emit("battle:waiting-updated");

        if (callback) {
          callback({
            status: "success",
            room: updatedRoom,
            players,
            participant
          });
        }
      } catch (err) {
        console.error("battle:join error", err);
        if (callback) callback({ error: "Internal server error" });
      }
    });

    socket.on("battle:ready", async (payload, callback) => {
      try {
        if (!socket.battleParticipant || !socket.battleRoom) return;
        const roomId = socket.battleRoom;
        const { isReady } = payload;
        
        const room = await BattleRoomStore.getRoom(roomId);
        if (!room || room.status !== "WAITING" && room.status !== "READY") return;

        await BattleRoomStore.updatePlayer(roomId, socket.battleParticipant.participantId, {
          ready: !!isReady
        });

        const players = await BattleRoomStore.getPlayers(roomId);
        battleNamespace.to(`battle:${roomId}`).emit("battle:player-updated", { players });
        
        if (callback) callback({ success: true });
      } catch (err) {
         console.error(err);
      }
    });

    socket.on("battle:start", async (payload, callback) => {
      try {
        if (!socket.battleParticipant || !socket.battleRoom) return;
        const roomId = socket.battleRoom;
        
        await BattleService.startBattle(roomId, socket.battleParticipant.participantId, battleNamespace);
        
        if (callback) callback({ success: true });
      } catch (err) {
        console.error("battle:start error", err);
        if (callback) callback({ error: err.message || "Failed to start battle" });
      }
    });

    socket.on("battle:leave", async () => {
      await handleDisconnect(socket, battleNamespace);
    });

    socket.on("battle:time_up", async (payload) => {
      try {
        const { roomId } = payload;
        const room = await BattleRoomStore.getRoom(roomId);
        if (!room || room.status !== "ACTIVE" || !room.startedAt) return;
        
        const start = parseInt(room.startedAt, 10);
        const durationMs = room.durationMinutes * 60 * 1000;
        const now = Date.now();
        
        // Check if time is actually up (allow small grace period)
        if (now >= start + durationMs - 5000) {
          const rankings = await BattleService.computeRankings(roomId);
          const winnerPid = rankings.length > 0 && rankings[0].solvedCount > 0 ? rankings[0].participantId : null;
          await BattleService.finalizeBattle(roomId, { status: "EXPIRED", winnerParticipantId: winnerPid, rankings });
          
          const finalRoom = await BattleRoomStore.getRoom(roomId);
          battleNamespace.to(`battle:${roomId}`).emit("battle:results", { 
            room: finalRoom, 
            rankings 
          });
        }
      } catch (err) {
        console.error("Battle time up error:", err);
      }
    });

    socket.on("battle:quit", async (payload, callback) => {
      if (socket.battleParticipant && socket.battleRoom) {
         try {
           const roomId = socket.battleRoom;
           const pid = socket.battleParticipant.participantId;
           socket.leave(`battle:${roomId}`);
           
           const room = await BattleRoomStore.getRoom(roomId);
           if (room && (room.status === "WAITING" || room.status === "READY")) {
              await BattleRoomStore.leaveRoom(roomId, pid, socket.battleUuid);
              const players = await BattleRoomStore.getPlayers(roomId);
              const updatedRoom = await BattleRoomStore.getRoom(roomId);
              
              battleNamespace.to(`battle:${roomId}`).emit("battle:player-left", { 
                players, 
                room: updatedRoom,
                leftParticipant: { displayName: socket.battleParticipant.displayName },
                currentPlayers: players.length,
                maxPlayers: updatedRoom ? updatedRoom.maxPlayers : 0
              });
              battleNamespace.emit("battle:waiting-updated");
           } else if (room) {
              // If ACTIVE, mark DISCONNECTED but don't remove their score
              await BattleRoomStore.updatePlayer(roomId, pid, { status: "DISCONNECTED" });
              const players = await BattleRoomStore.getPlayers(roomId);
              battleNamespace.to(`battle:${roomId}`).emit("battle:player-updated", { players });
              
              if (room.status === "ACTIVE") {
                const activePlayers = players.filter(p => p.status !== "DISCONNECTED");
                if (activePlayers.length === 0) {
                   await BattleService.checkAndFinalizeBattle(roomId, battleNamespace, { forceFinish: true, finalStatus: "ABANDONED" });
                } else {
                   await BattleService.checkAndFinalizeBattle(roomId, battleNamespace);
                }
              }
           }
           
           socket.battleParticipant = null;
           socket.battleRoom = null;
           socket.battleUuid = null;
         } catch (err) {
           console.error("battle:quit error", err);
         }
      }
      if (callback) callback({ success: true });
    });

    socket.on("battle:finish_early", async (payload, callback) => {
      if (socket.battleParticipant && socket.battleRoom) {
         try {
           const roomId = socket.battleRoom;
           const room = await BattleRoomStore.getRoom(roomId);
           if (room && room.status === "ACTIVE") {
             const players = await BattleRoomStore.getPlayers(roomId);
             const activeOpponents = players.filter(p => p.participantId !== socket.battleParticipant.participantId && p.status !== "DISCONNECTED");
             if (activeOpponents.length === 0) {
                await BattleService.checkAndFinalizeBattle(roomId, battleNamespace, { forceFinish: true, finalStatus: "EARLY_FINISHED" });
             }
           }
         } catch (err) {
           console.error("battle:finish_early error", err);
         }
      }
      if (callback) callback({ success: true });
    });

    socket.on("disconnect", async () => {
      await handleDisconnect(socket, battleNamespace);
    });
  });
}

async function handleDisconnect(socket, io) {
  if (socket.battleParticipant && socket.battleRoom) {
    try {
      const roomId = socket.battleRoom;
      const pid = socket.battleParticipant.participantId;
      socket.leave(`battle:${roomId}`);
      
      const room = await BattleRoomStore.getRoom(roomId);
      if (room && (room.status === "WAITING" || room.status === "READY")) {
         // Safely leave if not started
         await BattleRoomStore.leaveRoom(roomId, pid, socket.battleUuid);
         const players = await BattleRoomStore.getPlayers(roomId);
         const updatedRoom = await BattleRoomStore.getRoom(roomId);
         io.to(`battle:${roomId}`).emit("battle:player-left", { 
           players, 
           room: updatedRoom,
           leftParticipant: { displayName: socket.battleParticipant.displayName },
           currentPlayers: players.length,
           maxPlayers: updatedRoom.maxPlayers
         });
         
         // Notify global battle namespace about waiting room update
         io.emit("battle:waiting-updated");
      } else if (room) {
         // If ACTIVE, mark DISCONNECTED but don't remove
         await BattleRoomStore.updatePlayer(roomId, pid, { status: "DISCONNECTED" });
         const players = await BattleRoomStore.getPlayers(roomId);
         io.to(`battle:${roomId}`).emit("battle:player-updated", { players });
         
         if (room.status === "ACTIVE") {
            const activePlayers = players.filter(p => p.status !== "DISCONNECTED");
            if (activePlayers.length === 0) {
               await BattleService.checkAndFinalizeBattle(roomId, io, { forceFinish: true, finalStatus: "ABANDONED" });
            } else {
               await BattleService.checkAndFinalizeBattle(roomId, io);
            }
         }
      }
      
      socket.battleParticipant = null;
      socket.battleRoom = null;
      socket.battleUuid = null;
    } catch (err) {
      console.error("Battle Disconnect handling error", err);
    }
  }
}
