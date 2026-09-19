import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { useChat } from "./ChatContext";

export function MessageList() {
  const { messages, typingUsers } = useChat();
  const bottomRef = useRef(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const typingArray = Object.values(typingUsers);
  let typingText = "";
  if (typingArray.length === 1) typingText = `${typingArray[0]} is typing...`;
  else if (typingArray.length > 1) typingText = `${typingArray.length} people are typing...`;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar bg-slate-900">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-80 mt-10">
          <span className="text-4xl mb-4">🌎</span>
          <p className="text-sm font-medium">You're early.</p>
          <p className="text-xs text-center mt-1">Start the conversation.<br/>Say hello to everyone here.</p>
        </div>
      ) : (
        <div className="flex flex-col justify-end">
          {messages.map((msg, idx) => {
            const prevMsg = messages[idx - 1];
            // Show header if it's the first message, or if the sender changed
            const showHeader = !prevMsg || prevMsg.participantId !== msg.participantId;
            return <MessageBubble key={msg.id || idx} message={msg} showHeader={showHeader} />;
          })}
        </div>
      )}

      {/* Typing Indicator */}
      {typingText && (
        <div className="mt-2 ml-4 text-xs italic text-slate-500 animate-pulse">
          {typingText}
        </div>
      )}
      
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
