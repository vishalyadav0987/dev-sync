import React from 'react';
import { Loader2, CheckCircle2, CircleDashed, Users, Play } from 'lucide-react';

export function BattlePlayerStats({ players, room }) {
  const totalProblems = room?.problemIds ? room.problemIds.length : 1;

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'CONNECTED':
      case 'CODING':
        return <span className="text-blue-400 flex items-center gap-1.5"><CircleDashed size={12} className="animate-spin-slow" /> Coding</span>;
      case 'RUNNING':
        return <span className="text-amber-400 flex items-center gap-1.5"><Play size={12} className="fill-amber-400 animate-pulse" /> Running</span>;
      case 'SUBMITTED':
        return <span className="text-indigo-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> Submitting</span>;
      case 'SOLVED':
      case 'FINISHED':
        return <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={12} /> Solved</span>;
      case 'DISCONNECTED':
        return <span className="text-slate-500">Disconnected</span>;
      default:
        return <span className="text-slate-400">Waiting</span>;
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-200 text-sm tracking-wider flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          BATTLE STATS
        </h3>
        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded">
          {players.length} / {room?.maxPlayers}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {players.map((p) => {
          const totalScore = p.totalScore || 0;
          return (
            <div key={p.participantId} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 flex flex-col gap-2 transition-colors hover:bg-slate-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    p.status === 'DISCONNECTED' ? 'bg-rose-500' : 
                    p.status === 'FINISHED' ? 'bg-emerald-500' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  <span className="text-sm font-bold text-slate-200 truncate" title={p.displayName}>
                    {p.displayName}
                  </span>
                </div>
                {room?.hostParticipantId === p.participantId && (
                  <span className="text-[9px] font-black tracking-wider bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded shrink-0">
                    HOST
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="text-[11px] font-medium tracking-wide uppercase">
                  {getStatusDisplay(p.status)}
                </div>
                <div className="text-xs font-mono font-bold text-slate-400">
                  {totalScore} Score
                </div>
              </div>

              {/* Progress Bar - just showing if they have score > 0 for now since we might not know max score here */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${totalScore > 0 ? 'bg-indigo-500' : 'bg-transparent'}`}
                  style={{ width: `${Math.min((totalScore / (totalProblems * 10)) * 100, 100)}%` }} // rough estimate of progress
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
