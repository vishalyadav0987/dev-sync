import React from "react";
import { MessageCircle } from "lucide-react";
import { useChat } from "./ChatContext";

export function ChatLauncher() {
  const { toggleChat, unreadCount, isOpen } = useChat();

  if (isOpen) return null;

  return (
    <button
      onClick={toggleChat}
      className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-50 p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none"
      aria-label="Open Global Chat"
    >
      <MessageCircle size={28} />
      
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-sm ring-2 ring-slate-900">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
