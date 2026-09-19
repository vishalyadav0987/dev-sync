import React from 'react';
import { Users, Swords, Copy, Check, Play, User, Loader2 } from 'lucide-react';

export function BattleLobby({ room, problems, players, socket, uuid }) {
  const [copied, setCopied] = React.useState(false);

  const me = players.find(p => p.uuid === uuid);
  const isHost = room.hostParticipantId === me?.participantId;
  const isReady = me?.ready;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    if (!socket) return;
    socket.emit("battle:ready", { isReady: !isReady });
  };

  const handleStart = () => {
    if (!socket || !isHost) return;
    socket.emit("battle:start");
  };

  const allPlayersReady = players.length > 0 && players.every(p => p.ready);
  const canStart = isHost && allPlayersReady && (room.status === "READY" || room.status === "WAITING");

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#030712] text-white overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Swords size={20} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">DSA BATTLE</h1>
            <p className="text-xs text-slate-400">Room {room.roomId} {room.durationMinutes ? `• ${room.durationMinutes} Min` : ''}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Players</span>
            <span className="text-lg font-black text-indigo-400">{players.length} <span className="text-slate-500">/ {room.maxPlayers}</span></span>
          </div>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md text-sm text-slate-300 transition"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Invite Link'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        {/* Countdown Overlay */}
        {room.status === "COUNTDOWN" && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-sm">
            <div className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-purple-600 animate-pulse">
              {room.countdown > 0 ? room.countdown : "GO!"}
            </div>
          </div>
        )}

        <div className="w-full max-w-2xl bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Battle Questions ({problems?.length || 0})</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {problems?.map((p, idx) => (
                <div key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${
                    p.difficulty === 'EASY' ? 'bg-emerald-500' :
                    p.difficulty === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></span>
                  P{idx + 1}: {p.title.length > 20 ? p.title.substring(0, 20) + '...' : p.title}
                </div>
              ))}
            </div>
          </div>

          {/* Participants List */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-xl overflow-hidden mb-8">
            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 tracking-wider">PARTICIPANTS</span>
              <span className="text-xs font-medium text-slate-500">{players.length} joined</span>
            </div>
            <div className="divide-y divide-slate-800/50">
              {players.map((player) => (
                <div key={player.participantId} className={`flex items-center justify-between px-4 py-3 transition-colors ${player.ready ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 ring-2 ring-slate-800">
                      {player.avatar ? (
                        <img src={player.avatar} alt={player.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">
                          {player.displayName}
                          {player.uuid === uuid && <span className="text-indigo-400 ml-1 font-normal text-xs">(You)</span>}
                        </span>
                        {room.hostParticipantId === player.participantId && (
                           <span className="bg-amber-500/20 text-amber-500 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                             HOST
                           </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${player.ready ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {player.ready ? 'READY' : 'Waiting...'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {players.length < room.maxPlayers && (
              <div className="px-4 py-6 flex flex-col items-center justify-center text-slate-500 border-t border-slate-800/50 bg-slate-900/30">
                <Loader2 size={18} className="animate-spin mb-2 opacity-50" />
                <span className="text-xs font-medium">Waiting for players ({room.maxPlayers - players.length} slots open)...</span>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={toggleReady}
              className={`px-8 py-3 rounded-xl font-bold text-lg shadow-xl transition-all ${
                isReady 
                  ? 'bg-slate-700 text-white hover:bg-slate-600' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:scale-105 hover:shadow-indigo-500/25'
              }`}
            >
              {isReady ? 'CANCEL READY' : 'I AM READY'}
            </button>

            {isHost && (
              <button
                onClick={handleStart}
                disabled={!canStart}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg shadow-xl transition-all ${
                  canStart 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white hover:scale-105 hover:shadow-emerald-500/25' 
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Play fill="currentColor" size={20} />
                START BATTLE
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
