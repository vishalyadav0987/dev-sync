import { redisClient, CHAT_KEYS } from "./chat.redis.js";
import { generateAnonymousIdentity } from "./chat.identity.js";
import { prisma } from "../../lib/prisma.js";

const IDENTITY_TTL_SECONDS = parseInt(process.env.CHAT_IDENTITY_TTL || "86400", 10);
const MAX_MESSAGES = parseInt(process.env.CHAT_MAX_MESSAGES || "500", 10);

/**
 * Validates or creates a chat participant identity for an anonymous UUID.
 * Also syncs the displayName to the PostgreSQL GuestSession so that
 * leaderboards, battle profiles, and chat all show the same name.
 */
export async function getOrCreateParticipant(uuid) {
  const userMapKey = CHAT_KEYS.userParticipantMap(uuid);
  
  // Check if they already have an active participant ID
  let participantId = await redisClient.get(userMapKey);
  let participantData = null;

  if (participantId) {
    const dataStr = await redisClient.get(CHAT_KEYS.participantIdentity(participantId));
    if (dataStr) {
      participantData = JSON.parse(dataStr);
    }
  }

  // If expired or missing, create new
  if (!participantData) {
    const newIdentity = generateAnonymousIdentity();
    participantId = newIdentity.participantId;
    participantData = {
      participantId: newIdentity.participantId,
      displayName: newIdentity.displayName,
      avatar: newIdentity.avatar,
      createdAt: new Date().toISOString(),
    };

    const multi = redisClient.multi();
    multi.set(userMapKey, participantId, "EX", IDENTITY_TTL_SECONDS);
    multi.set(CHAT_KEYS.participantIdentity(participantId), JSON.stringify(participantData), "EX", IDENTITY_TTL_SECONDS);
    await multi.exec();
  } else {
    // Extend TTL on active use
    const multi = redisClient.multi();
    multi.expire(userMapKey, IDENTITY_TTL_SECONDS);
    multi.expire(CHAT_KEYS.participantIdentity(participantId), IDENTITY_TTL_SECONDS);
    await multi.exec();
  }

  // Sync displayName to PostgreSQL GuestSession so leaderboard/profile match chat
  try {
    await prisma.guestSession.update({
      where: { id: uuid },
      data: { displayName: participantData.displayName }
    });
  } catch (_) {
    // GuestSession might not exist yet (created lazily by guestAuth middleware)
    // Silently ignore — it will be synced on next API call
  }

  return participantData;
}



/**
 * Adds a message to the room's Redis Stream
 */
export async function addMessage(roomId, messageObj) {
  // messageObj should have: { id, participantId, displayName, avatar, type, content, createdAt, ... }
  const streamKey = CHAT_KEYS.roomMessages(roomId);
  
  // Add to stream with MAXLEN (approximate trim for performance using ~)
  const messageId = await redisClient.xadd(
    streamKey,
    "MAXLEN", "~", MAX_MESSAGES,
    "*",
    "payload", JSON.stringify(messageObj)
  );
  
  return messageId;
}

/**
 * Gets recent messages from the stream
 */
export async function getRecentMessages(roomId, count = 50) {
  const streamKey = CHAT_KEYS.roomMessages(roomId);
  // Get last N items
  const messages = await redisClient.xrevrange(streamKey, "+", "-", "COUNT", count);
  
  // Format from Redis streams
  // messages looks like: [ [ '1690000000000-0', [ 'payload', '{"id":...}' ] ], ... ]
  const parsedMessages = messages.reverse().map(msg => {
    const payloadIndex = msg[1].indexOf("payload");
    return JSON.parse(msg[1][payloadIndex + 1]);
  });

  // Fetch reactions for all messages
  const pipeline = redisClient.pipeline();
  parsedMessages.forEach(m => {
    pipeline.hgetall(CHAT_KEYS.messageReactions(roomId, m.id));
  });
  
  const reactionsResults = await pipeline.exec();
  
  return parsedMessages.map((msg, index) => {
    const [err, reactionsMap] = reactionsResults[index];
    if (reactionsMap && Object.keys(reactionsMap).length > 0) {
      // Redis hashes return values as strings, convert to numbers
      const formattedReactions = {};
      for (const [emoji, count] of Object.entries(reactionsMap)) {
        formattedReactions[emoji] = parseInt(count, 10);
      }
      msg.reactions = formattedReactions;
    }
    return msg;
  });
}

export async function addReaction(roomId, messageId, emoji) {
  const key = CHAT_KEYS.messageReactions(roomId, messageId);
  await redisClient.hincrby(key, emoji, 1);
  // Optional: expire reactions after 24h
  await redisClient.expire(key, 86400);
  
  const allReactions = await redisClient.hgetall(key);
  const formattedReactions = {};
  for (const [e, count] of Object.entries(allReactions)) {
    formattedReactions[e] = parseInt(count, 10);
  }
  return formattedReactions;
}
