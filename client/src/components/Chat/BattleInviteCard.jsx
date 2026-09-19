import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Users, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';

export function BattleInviteCard({ invite }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(invite.status || 'WAITING');
  const [checking, setChecking] = useState(false);

  // Check if battle is still joinable when the card mounts
  useEffect(() => {
    let cancelled = false;
    async function checkStatus() {
      try {
        const data = await api.getBattle(invite.battleId);
        if (!cancelled && data?.room?.status) {
          setStatus(data.room.status);
        }
      } catch {
        // Battle no longer exists in Redis — it's finished/expired
        if (!cancelled) setStatus('ENDED');
      }
    }
    checkStatus();
    return () => { cancelled = true; };
  }, [invite.battleId]);

  const handleJoin = async () => {
    setChecking(true);
    try {
      const data = await api.getBattle(invite.battleId);
      if (data?.room?.status === 'WAITING' || data?.room?.status === 'READY') {
        navigate(`/battle/${invite.battleId}`);
      } else {
        setStatus(data?.room?.status || 'ENDED');
      }
    } catch {
      setStatus('ENDED');
    } finally {
      setChecking(false);
    }
  };

  const isJoinable = status === 'WAITING' || status === 'READY';
  const isActive = status === 'ACTIVE' || status === 'COUNTDOWN';
  const isEnded = status === 'FINISHED' || status === 'EXPIRED' || status === 'ENDED';

  return (
    <div className="w-64 bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg my-1">
      <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords size={16} className="text-indigo-400" />
          <span className="text-xs font-bold text-slate-200 tracking-wider">DSA BATTLE</span>
        </div>
        {isEnded && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 border border-gray-500/30">ENDED</span>
        )}
        {isActive && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">LIVE</span>
        )}
      </div>
      
      <div className="p-4 flex flex-col gap-3">
        <div className="text-sm font-medium text-slate-300">
          <span className="font-bold text-indigo-400">{invite.displayName}</span> created a Battle
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
          <div className="font-bold text-slate-200 truncate" title={invite.problemTitle}>
            {invite.problemTitle}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
              invite.difficulty === 'EASY' ? 'bg-emerald-500/20 text-emerald-400' :
              invite.difficulty === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
              'bg-rose-500/20 text-rose-400'
            }`}>
              {invite.difficulty}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
              <Users size={12} />
              <span>{invite.currentPlayers} / {invite.maxPlayers}</span>
            </div>
          </div>
        </div>

        {isJoinable && (
          <button 
            onClick={handleJoin}
            disabled={checking}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors shadow-md shadow-indigo-900/20"
          >
            {checking ? 'Checking...' : 'JOIN BATTLE'}
          </button>
        )}

        {isActive && (
          <div className="w-full py-2 text-center text-amber-400 text-sm font-bold bg-amber-500/10 border border-amber-500/20 rounded-lg">
            Battle In Progress
          </div>
        )}

        {isEnded && (
          <div className="w-full py-2 text-center text-gray-400 text-sm font-semibold bg-gray-500/10 border border-gray-500/20 rounded-lg">
            Battle Ended
          </div>
        )}
      </div>
    </div>
  );
}
