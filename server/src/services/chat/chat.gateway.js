import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, redisSubClient, CHAT_KEYS } from "./chat.redis.js";
import { getOrCreateParticipant, addMessage, getRecentMessages, addReaction } from "./chat.service.js";
import crypto from "crypto";

const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX_MESSAGES = parseInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE || "20", 10);

async function getUniqueOnlineCount(io, roomId, excludeSocketId = null) {
  try {
    const sockets = await io.in(`chat:${roomId}`).fetchSockets();
    const uniqueParticipants = new Set();
    for (const s of sockets) {
      if (s.id !== excludeSocketId && s.data && s.data.participantId) {
        uniqueParticipants.add(s.data.participantId);
      }
    }
    return uniqueParticipants.size;
  } catch (err) {
    console.error("Failed to fetch sockets:", err);
    return 0;
  }
}

export function setupChatGateway(io) {
  // Use Redis adapter for multi-instance scalability
  io.adapter(createAdapter(redisClient, redisSubClient));

  io.on("connection", (socket) => {
    
    // In Socket.IO, we'll store participant info directly on the socket object
    // for easy cleanup on disconnect.
    socket.chatParticipant = null;
    socket.chatRoom = null;

    socket.on("chat:join", async (payload, callback) => {
      try {
        const { uuid, roomId = "global" } = payload;
        
        if (!uuid) {
          return callback && callback({ error: "Missing UUID" });
        }

        // Get or generate identity
        const participant = await getOrCreateParticipant(uuid);
        
        // Join Socket.io room
        const socketRoom = `chat:${roomId}`;
        socket.join(socketRoom);
        
        // Track state
        socket.chatParticipant = participant;
        socket.chatRoom = roomId;
        socket.chatUuid = uuid;
        socket.data = { participantId: participant.participantId };

        // Presence via active sockets (resilient to ghost connections)
        const onlineCount = await getUniqueOnlineCount(io, roomId);

        // Fetch recent messages
        const history = await getRecentMessages(roomId);

        // Notify room of presence update
        io.to(socketRoom).emit("chat:presence", { onlineCount });

        // Respond to client
        if (callback) {
          callback({
            status: "success",
            roomId,
            participant,
            onlineCount,
            history
          });
        }
      } catch (err) {
        console.error("chat:join error", err);
        if (callback) callback({ error: "Internal server error" });
      }
    });

    socket.on("chat:message", async (payload, callback) => {
      try {
        if (!socket.chatParticipant || !socket.chatRoom) {
          return callback && callback({ error: "Not joined to a room" });
        }

        const { type, content, mediaUrl, width, height, replyToId, mentions } = payload;
        
        // Very basic rate limiting
        const rateLimitKey = CHAT_KEYS.rateLimit(socket.chatUuid);
        const currentCount = await redisClient.incr(rateLimitKey);
        if (currentCount === 1) {
          await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW);
        }
        
        if (currentCount > RATE_LIMIT_MAX_MESSAGES) {
          return callback && callback({ error: "Rate limit exceeded. Please wait a moment." });
        }

        // Construct stable message
        const messageId = `msg_${crypto.randomUUID()}`;
        const messageObj = {
          id: messageId,
          roomId: socket.chatRoom,
          participantId: socket.chatParticipant.participantId,
          displayName: socket.chatParticipant.displayName,
          avatar: socket.chatParticipant.avatar,
          type: type || "text",
          content: content || "",
          mediaUrl: mediaUrl || null,
          width: width || null,
          height: height || null,
          replyToId: replyToId || null,
          mentions: mentions || null,
          createdAt: new Date().toISOString()
        };

        // Basic validation
        if (messageObj.type === "text") {
          if (!messageObj.content.trim()) return callback && callback({ error: "Message is empty" });
          if (messageObj.content.length > 2000) return callback && callback({ error: "Message too long" });
        }

        // Save to Redis Streams
        await addMessage(socket.chatRoom, messageObj);

        // Broadcast to everyone in room
        io.to(`chat:${socket.chatRoom}`).emit("chat:message", messageObj);

        if (callback) callback({ status: "success", messageId });
      } catch (err) {
        console.error("chat:message error", err);
        if (callback) callback({ error: "Message failed to send" });
      }
    });

    socket.on("chat:typing:start", () => {
      if (!socket.chatParticipant || !socket.chatRoom) return;
      socket.broadcast.to(`chat:${socket.chatRoom}`).emit("chat:typing", {
        participantId: socket.chatParticipant.participantId,
        displayName: socket.chatParticipant.displayName,
        isTyping: true
      });
    });

    socket.on("chat:typing:stop", () => {
      if (!socket.chatParticipant || !socket.chatRoom) return;
      socket.broadcast.to(`chat:${socket.chatRoom}`).emit("chat:typing", {
        participantId: socket.chatParticipant.participantId,
        displayName: socket.chatParticipant.displayName,
        isTyping: false
      });
    });

    socket.on("chat:react", async (payload, callback) => {
      try {
        if (!socket.chatParticipant || !socket.chatRoom) return;
        const { messageId, reaction } = payload;
        
        if (!messageId || !reaction) return;

        // Basic validation for allowed emojis
        const ALLOWED_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];
        if (!ALLOWED_REACTIONS.includes(reaction)) return;

        const reactions = await addReaction(socket.chatRoom, messageId, reaction);
        
        // Broadcast the reaction update
        io.to(`chat:${socket.chatRoom}`).emit("chat:react", { messageId, reactions });
        
        if (callback) callback({ status: "success" });
      } catch (err) {
        console.error("chat:react error", err);
        if (callback) callback({ error: "Reaction failed" });
      }
    });

    socket.on("chat:leave", async () => {
      await handleDisconnect(socket, io);
    });

    socket.on("disconnect", async () => {
      await handleDisconnect(socket, io);
    });
  });
}

async function handleDisconnect(socket, io) {
  if (socket.chatParticipant && socket.chatRoom) {
    try {
      const roomId = socket.chatRoom;
      socket.leave(`chat:${roomId}`);
      
      const onlineCount = await getUniqueOnlineCount(io, roomId, socket.id);
      
      io.to(`chat:${roomId}`).emit("chat:presence", { onlineCount });
      
      socket.chatParticipant = null;
      socket.chatRoom = null;
    } catch (err) {
      console.error("Disconnect handling error", err);
    }
  }
}
