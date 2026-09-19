import Redis from "ioredis";

// Use environment variable or fallback to localhost for development
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Primary client for general commands and pub/sub publishing
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Subscriber client for pub/sub (and socket.io adapter)
export const redisSubClient = redisClient.duplicate();

redisClient.on("error", (err) => console.error("Battle Redis Client Error:", err));
redisSubClient.on("error", (err) => console.error("Battle Redis SubClient Error:", err));

// --- Redis Namespace Constants ---
export const BATTLE_KEYS = {
  room: (roomId) => `battle:room:${roomId}`,
  roomPlayers: (roomId) => `battle:room:${roomId}:players`,
  player: (roomId, participantId) => `battle:room:${roomId}:player:${participantId}`,
  winner: (roomId) => `battle:room:${roomId}:winner`,
  submissions: (roomId) => `battle:room:${roomId}:submissions`,
  userParticipantMap: (uuid) => `battle:participant:${uuid}`,
  waitingRooms: () => `battle:waiting`,
};

// Define atomic JOIN script
// KEYS[1] = roomKey
// KEYS[2] = playersKey
// KEYS[3] = playerKey
// KEYS[4] = userMapKey
// ARGV[1] = participantId
// ARGV[2] = roomId
// ARGV[3] = maxPlayers
// ARGV[4] = playerMeta (JSON)
redisClient.defineCommand("atomicJoinRoom", {
  numberOfKeys: 4,
  lua: `
    local roomKey = KEYS[1]
    local playersKey = KEYS[2]
    local playerKey = KEYS[3]
    local userMapKey = KEYS[4]
    
    local participantId = ARGV[1]
    local roomId = ARGV[2]
    local maxPlayers = tonumber(ARGV[3])
    local playerMeta = ARGV[4]

    -- 1. Check if user is already in the room
    local isMember = redis.call('SISMEMBER', playersKey, participantId)
    if isMember == 1 then
      return '{"success":true,"message":"ALREADY_JOINED"}'
    end

    -- 2. Check if room exists and is WAITING or READY
    local status = redis.call('HGET', roomKey, 'status')
    if not status then
      return '{"success":false,"reason":"ROOM_NOT_FOUND"}'
    end
    if status ~= 'WAITING' and status ~= 'READY' then
      return '{"success":false,"reason":"INVALID_STATUS"}'
    end

    -- 3. Check if user already has an active battle in userMapKey
    local existingActive = redis.call('GET', userMapKey)
    if existingActive and existingActive ~= participantId then
      -- User is already in another battle
      return '{"success":false,"reason":"ALREADY_IN_BATTLE"}'
    end

    -- 4. Check player count
    local count = redis.call('SCARD', playersKey)
    if count >= maxPlayers then
      return '{"success":false,"reason":"ROOM_FULL"}'
    end

    -- 5. Add player
    redis.call('SADD', playersKey, participantId)
    redis.call('SET', playerKey, playerMeta)
    
    -- 6. Link user map
    redis.call('SET', userMapKey, participantId)
    redis.call('EXPIRE', userMapKey, 7200) -- 2 hours TTL max for active battle lock
    
    local newCount = count + 1
    
    -- 7. Update status to READY if full
    if newCount >= maxPlayers and status == 'WAITING' then
       redis.call('HSET', roomKey, 'status', 'READY')
       redis.call('SREM', 'battle:waiting', roomId)
       return '{"success":true,"playerCount":' .. newCount .. ',"statusChangedTo":"READY"}'
    end

    return '{"success":true,"playerCount":' .. newCount .. '}'
  `
});

// Atomic Winner Lock
// KEYS[1] = winnerKey
// ARGV[1] = participantId
redisClient.defineCommand("atomicSetWinner", {
  numberOfKeys: 1,
  lua: `
    local winnerKey = KEYS[1]
    local participantId = ARGV[1]
    local success = redis.call('SETNX', winnerKey, participantId)
    if success == 1 then
      return '{"success":true}'
    else
      return '{"success":false}'
    end
  `
});
