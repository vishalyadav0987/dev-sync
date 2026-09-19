import Redis from "ioredis";

// Use environment variable or fallback to localhost for development
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Primary client for general commands and pub/sub publishing
export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Subscriber client for pub/sub (and socket.io adapter)
export const redisSubClient = redisClient.duplicate();

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisSubClient.on("error", (err) => console.error("Redis SubClient Error:", err));

// --- Redis Namespace Constants ---
export const CHAT_KEYS = {
  // Sets: Active connections/participants in a room
  roomPresence: (roomId) => `chat:room:${roomId}:presence`,
  
  // Hashes/JSON: Maps participantId -> temporary identity { displayName, avatar, roomId, ... }
  participantIdentity: (participantId) => `chat:participant:${participantId}`,
  
  // Strings: Maps anonymous UUID -> active participantId (with TTL)
  userParticipantMap: (uuid) => `chat:user:${uuid}`,

  // Streams or Lists: Recent messages per room
  roomMessages: (roomId) => `chat:room:${roomId}:messages`,

  // Rate Limiting
  rateLimit: (uuid) => `chat:ratelimit:${uuid}`,

  // Typing state (Sets)
  roomTyping: (roomId) => `chat:room:${roomId}:typing`,

  // Reactions (Hashes)
  messageReactions: (roomId, messageId) => `chat:${roomId}:message:${messageId}:reactions`,
};
