import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { socket } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected"); // connecting, connected, disconnected, error
  const [participant, setParticipant] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);

  const roomId = "global";

  useEffect(() => {
    // Initial join when context mounts
    joinChat();

    // Socket Event Listeners
    socket.on("connect", joinChat);
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    
    socket.on("chat:message", handleNewMessage);
    socket.on("chat:presence", (data) => setOnlineCount(data.onlineCount));
    socket.on("chat:typing", handleTyping);
    socket.on("chat:react", handleReaction);

    return () => {
      socket.off("connect", joinChat);
      socket.off("disconnect");
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:presence");
      socket.off("chat:typing", handleTyping);
      socket.off("chat:react", handleReaction);
    };
  }, []);

  // Clear unread when opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const joinChat = () => {
    if (!socket.connected) return;
    
    setConnectionStatus("connecting");
    const uuid = getGuestId();

    socket.emit("chat:join", { uuid, roomId }, (res) => {
      if (res.error) {
        setConnectionStatus("error");
        console.error("Chat join error:", res.error);
        return;
      }
      
      setConnectionStatus("connected");
      setParticipant(res.participant);
      setOnlineCount(res.onlineCount);
      setMessages(res.history || []);
    });
  };

  const handleNewMessage = (msg) => {
    setMessages((prev) => {
      // Prevent duplicates
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    setIsOpen((currentIsOpen) => {
      if (!currentIsOpen) {
        setUnreadCount((prev) => prev + 1);
      }
      return currentIsOpen;
    });

    // Clear typing indicator for this user immediately when they send a message
    setTypingUsers((prev) => {
      const newTyping = { ...prev };
      delete newTyping[msg.participantId];
      return newTyping;
    });
  };

  const handleTyping = ({ participantId, displayName, isTyping }) => {
    setTypingUsers((prev) => {
      const newTyping = { ...prev };
      if (isTyping) {
        newTyping[participantId] = displayName;
      } else {
        delete newTyping[participantId];
      }
      return newTyping;
    });
  };

  const handleReaction = ({ messageId, reactions }) => {
    setMessages((prev) => 
      prev.map((msg) => (msg.id === messageId ? { ...msg, reactions } : msg))
    );
  };

  const sendMessage = async (payload) => {
    // Optimistic UI could be added here
    return new Promise((resolve, reject) => {
      socket.emit("chat:message", payload, (res) => {
        if (res.error) {
          reject(new Error(res.error));
        } else {
          resolve(res);
        }
      });
    });
  };

  const sendTyping = (isTyping) => {
    if (!socket.connected) return;
    socket.emit(`chat:typing:${isTyping ? "start" : "stop"}`);
  };

  const sendReaction = (messageId, reaction) => {
    if (!socket.connected) return;
    socket.emit("chat:react", { messageId, reaction });
  };

  const toggleChat = () => setIsOpen((prev) => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        toggleChat,
        openChat,
        closeChat,
        connectionStatus,
        participant,
        onlineCount,
        messages,
        typingUsers,
        unreadCount,
        sendMessage,
        sendTyping,
        sendReaction,
        replyingTo,
        setReplyingTo,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
