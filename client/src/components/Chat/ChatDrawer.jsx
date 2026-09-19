import React from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { useChat } from "./ChatContext";

export function ChatDrawer() {
  const { isOpen } = useChat();

  return (
    <>
      {/* Backdrop for mobile only */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden" />
      )}
      
      {/* Drawer */}
      <div
        className={`fixed top-0 md:top-auto md:bottom-24 right-0 md:right-6 z-50 h-full md:h-[600px] md:max-h-[calc(100vh-120px)] w-full md:w-[380px] bg-slate-900 md:rounded-xl shadow-2xl border-l md:border border-slate-700 flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <ChatHeader />
        <MessageList />
        <MessageComposer />
      </div>
    </>
  );
}
