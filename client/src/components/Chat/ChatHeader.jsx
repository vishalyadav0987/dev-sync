import React from "react";
import { X, Globe2, Wifi, WifiOff, Swords } from "lucide-react";
import { useChat } from "./ChatContext";

export function ChatHeader() {
  const { closeChat, onlineCount, connectionStatus } = useChat();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
          <Globe2 size={18} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 leading-none">Global Chat</h3>
          <div className="flex items-center gap-1.5 mt-1">
            {connectionStatus === "connected" ? (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[11px] font-medium text-slate-400">{onlineCount} online</span>
              </>
            ) : connectionStatus === "connecting" ? (
              <>
                <Wifi size={10} className="text-amber-500 animate-pulse" />
                <span className="text-[11px] font-medium text-amber-500">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff size={10} className="text-rose-500" />
                <span className="text-[11px] font-medium text-rose-500">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => document.getElementById("battle_create_modal")?.showModal()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors border border-indigo-500/20"
          title="Start DSA Battle"
        >
          <Swords size={16} />
          <span className="text-xs font-semibold">Battle</span>
        </button>
        <div className="w-px h-4 bg-slate-700 mx-1"></div>
        <button
          onClick={closeChat}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          aria-label="Close Chat"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
