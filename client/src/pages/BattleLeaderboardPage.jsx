import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Clock, Users, ArrowLeft, RefreshCw, Activity, Award } from "lucide-react";
import { api } from "../lib/api";
import { formatDistanceToNow } from "date-fns";

export default function BattleLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ leaderboard: [], recentBattles: [] });
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getBattleLeaderboard();
      setStats(data);
    } catch (err) {
      setError("Failed to load battle statistics.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-full bg-[#030712] text-white p-6 relative overflow-y-auto">
      <div className="absolute inset-0 bg-blue-500/5 mix-blend-screen pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dsa"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                Battle Leaderboard
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Top players and recent battle history
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </header>

        {error && (
          <div className="p-4 mb-8 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Players (Leaderboard) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <h2 className="font-semibold">Top Champions</h2>
              </div>
              
              <div className="p-0">
                {loading && stats.leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Loading ranks...</div>
                ) : stats.leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No champions yet. Be the first!</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {stats.leaderboard.map((player, index) => (
                      <div 
                        key={player.id} 
                        className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${index < 3 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                          ${index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                            index === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' : 
                            index === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' : 
                            'bg-white/5 text-gray-500'}`}
                        >
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/battle/user/${player.id}`}
                            className="font-medium truncate hover:underline block text-white"
                          >
                            {player.displayName}
                          </Link>
                          {player.longestStreak > 0 && (
                            <div className="text-xs text-orange-400 flex items-center gap-1">
                              🔥 {player.longestStreak} streak
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-400">{player.wins}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider">Wins</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Battles */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold">Recent Battles</h2>
              </div>

              <div className="p-0">
                {loading && stats.recentBattles.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Loading history...</div>
                ) : stats.recentBattles.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No battles have finished yet.</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {stats.recentBattles.map((battle) => (
                      <div key={battle.id} className="p-4 hover:bg-white/5 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs px-2 py-1 bg-white/5 rounded text-gray-400 border border-white/10 shrink-0">
                              #{battle.roomId}
                            </span>
                            <span className="text-sm text-gray-400 flex items-center gap-1 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            {battle.problems.map(p => (
                              <div key={p.title} className="text-sm font-medium flex items-center max-w-full">
                                <span className="truncate">{p.title}</span>
                                <span className={`ml-2 shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border ${
                                  p.difficulty === 'EASY' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                  p.difficulty === 'MEDIUM' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                  'border-red-500/30 text-red-400 bg-red-500/10'
                                }`}>
                                  {p.difficulty}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-gray-500 text-xs">Winner</span>
                            {battle.winner ? (
                              <span className="font-semibold text-yellow-400 flex items-center gap-1">
                                <Trophy className="w-3.5 h-3.5" />
                                <Link 
                                  to={`/battle/user/${battle.winner.id}`}
                                  className="hover:underline text-yellow-400"
                                >
                                  {battle.winner.displayName}
                                </Link>
                              </span>
                            ) : (
                              <span className="text-gray-500 italic">Draw / Expired</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end border-l border-white/10 pl-6">
                            <span className="text-gray-500 text-xs">Players</span>
                            <span className="flex items-center gap-1 text-gray-300">
                              <Users className="w-3.5 h-3.5" />
                              {battle.maxPlayers}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
