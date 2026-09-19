import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trophy, Clock, Users, Flame, Award, Target, Zap, Brain, Shield, Crown, Swords, TrendingUp, Lock } from "lucide-react";
import { api } from "../lib/api";
import { formatDistanceToNow } from "date-fns";

// ── Helpers ──
function formatTime(seconds) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getActivityColor(count) {
  if (!count) return "bg-white/[0.03]";
  if (count === 1) return "bg-indigo-500/30";
  if (count === 2) return "bg-indigo-500/50";
  if (count >= 3) return "bg-indigo-500/80";
}

// ── Win Rate Ring ──
function WinRateRing({ rate, wins, losses }) {
  const circumference = 2 * Math.PI * 54;
  const filled = (rate / 100) * circumference;
  const empty = circumference - filled;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke="url(#winGrad)" strokeWidth="10"
            strokeDasharray={`${filled} ${empty}`}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="winGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{rate}%</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Win Rate</span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <span className="text-emerald-400 font-semibold">{wins} Wins</span>
        <span className="text-rose-400 font-semibold">{losses} Losses</span>
      </div>
    </div>
  );
}

// ── Activity Heatmap ──
function ActivityHeatmap({ activityMap }) {
  const weeks = useMemo(() => {
    const result = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    // Build 13 weeks (91 days)
    for (let w = 12; w >= 0; w--) {
      const week = [];
      for (let d = 6; d >= 0; d--) {
        const day = new Date(today);
        day.setDate(day.getDate() - (w * 7 + d));
        const key = day.toISOString().split('T')[0];
        week.push({ date: key, count: activityMap[key] || 0 });
      }
      result.push(week);
    }
    return result;
  }, [activityMap]);

  const hasAny = Object.keys(activityMap).length > 0;

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Battle Activity</h3>
      {!hasAny ? (
        <div className="text-gray-500 text-sm py-4 text-center">No battle activity yet.</div>
      ) : (
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3.5 h-3.5 rounded-sm ${getActivityColor(day.count)} transition-colors`}
                  title={`${day.date}: ${day.count} battle${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── XP Bar ──
function XPBar({ xp, level, nextLevel }) {
  const progress = nextLevel
    ? Math.min(100, Math.round(((xp - level.xp) / (nextLevel.xp - level.xp)) * 100))
    : 100;
  return (
    <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xs font-black px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            LVL {level.level}
          </div>
          <span className="text-sm font-semibold text-gray-300">{level.title}</span>
        </div>
        <span className="text-xs text-gray-500 font-mono">{xp} XP</span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      {nextLevel && (
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-500 font-mono">
          <span>{level.xp}</span>
          <span>{nextLevel.xp} XP to Level {nextLevel.level}</span>
        </div>
      )}
    </div>
  );
}

// ── Difficulty Bars ──
function DifficultyBreakdown({ difficultyStats }) {
  const max = Math.max(difficultyStats.EASY, difficultyStats.MEDIUM, difficultyStats.HARD, 1);
  const items = [
    { label: "Easy", count: difficultyStats.EASY, color: "from-emerald-500 to-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Medium", count: difficultyStats.MEDIUM, color: "from-amber-500 to-yellow-400", text: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Hard", count: difficultyStats.HARD, color: "from-rose-500 to-pink-400", text: "text-rose-400", bg: "bg-rose-500/10" },
  ];
  return (
    <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Performance by Difficulty</h3>
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-bold ${item.text} uppercase tracking-wider`}>{item.label}</span>
              <span className="text-sm font-bold text-white">{item.count} wins</span>
            </div>
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                style={{ width: `${(item.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function BattleUserProfilePage() {
  const { guestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await api.getUserBattleStats(guestId);
        setUserData(data);
      } catch (err) {
        setError(err.message || "Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [guestId]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#030712] text-white flex justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading Profile...</span>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-full bg-[#030712] text-white p-8">
        <Link to="/battle/leaderboard" className="text-blue-400 hover:underline mb-4 inline-block">&larr; Back to Leaderboard</Link>
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  const { profile, stats, achievements, activityMap, history } = userData;
  const hasData = stats.totalMatches > 0;

  return (
    <div className="min-h-full bg-[#030712] text-white overflow-y-auto">
      {/* ── Hero Header ── */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-indigo-950/40 to-transparent">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-6xl mx-auto px-6 pt-6 pb-8 relative">
          <Link
            to="/battle/leaderboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Leaderboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full rounded-[14px] bg-[#0f172a] flex items-center justify-center text-3xl font-black text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">{profile.displayName}</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {stats.level.title} · Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Right: Rank + Streak badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {stats.leaderboardRank > 0 && (
                <Link
                  to="/battle/leaderboard"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 font-bold shadow-lg shadow-yellow-500/5 hover:bg-yellow-500/20 transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  RANK #{stats.leaderboardRank}
                </Link>
              )}
              {profile.currentStreak > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 font-bold shadow-lg shadow-orange-500/5">
                  <Flame className="w-4 h-4 fill-current" />
                  {profile.currentStreak} Day Streak
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-bold shadow-lg shadow-indigo-500/5">
                <Zap className="w-4 h-4" />
                {stats.battleXP} XP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {!hasData ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Swords className="w-16 h-16 text-gray-700 mb-4" />
            <h2 className="text-2xl font-bold text-gray-400 mb-2">No battles yet</h2>
            <p className="text-gray-500 max-w-md">Start your first Battle to build your competitive profile. Your stats, achievements, and activity will appear here.</p>
            <Link to="/" className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
              Find a Battle
            </Link>
          </div>
        ) : (
          <>
            {/* Row 1: Stats Grid + Win Rate Ring */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Stats Cards (2x2) */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                {/* Battles */}
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 group hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Battles</span>
                  </div>
                  <div className="text-3xl font-black">{stats.totalMatches}</div>
                  <div className="text-xs text-gray-500 mt-1">Total matches played</div>
                </div>

                {/* Victories */}
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 group hover:border-yellow-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Victories</span>
                  </div>
                  <div className="text-3xl font-black">{stats.totalWins}</div>
                  <div className="text-xs text-gray-500 mt-1">{stats.winRate}% of matches</div>
                </div>

                {/* Problems Solved */}
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 group hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Solved</span>
                  </div>
                  <div className="text-3xl font-black">{stats.totalProblemsSolved}</div>
                  <div className="text-xs text-gray-500 mt-1">Problems</div>
                </div>

                {/* Avg Time */}
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-5 group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Time</span>
                  </div>
                  <div className="text-3xl font-black font-mono">{formatTime(stats.avgSolveTime)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.fastestSolve ? `Fastest: ${formatTime(stats.fastestSolve)}` : 'Per battle won'}
                  </div>
                </div>
              </div>

              {/* Win Rate Ring */}
              <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 flex items-center justify-center">
                <WinRateRing rate={stats.winRate} wins={stats.totalWins} losses={stats.totalLosses} />
              </div>
            </div>

            {/* Row 2: XP Bar */}
            <div className="mb-8">
              <XPBar xp={stats.battleXP} level={stats.level} nextLevel={stats.nextLevel} />
            </div>

            {/* Row 3: Activity + Difficulty + Streak */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <ActivityHeatmap activityMap={activityMap} />
              </div>
              <div className="space-y-6">
                <DifficultyBreakdown difficultyStats={stats.difficultyStats} />
                
                {/* Streak Card */}
                <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Streak</h3>
                  <div className="flex items-baseline gap-3">
                    <Flame className="w-8 h-8 text-orange-400 fill-current shrink-0" />
                    <div>
                      <div className="text-4xl font-black">{profile.currentStreak}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Current Streak</div>
                    </div>
                  </div>
                  {profile.longestStreak > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 text-sm text-gray-400">
                      Longest: <span className="font-bold text-white">{profile.longestStreak} days</span>
                    </div>
                  )}
                  {stats.maxConsecWins > 0 && (
                    <div className="mt-2 text-sm text-gray-400">
                      Best win streak: <span className="font-bold text-yellow-400">{stats.maxConsecWins} wins</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 4: Achievements */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6 mb-8">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Achievements</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {achievements.map(a => (
                  <div
                    key={a.id}
                    className={`flex flex-col items-center text-center p-4 rounded-xl border transition-colors ${
                      a.unlocked
                        ? 'bg-white/5 border-white/10 hover:border-indigo-500/30'
                        : 'bg-black/20 border-white/5 opacity-40'
                    }`}
                    title={a.desc || a.name}
                  >
                    <span className="text-2xl mb-2">{a.unlocked ? a.icon : '🔒'}</span>
                    <span className="text-xs font-bold text-gray-300 leading-tight">{a.name}</span>
                    {a.desc && <span className="text-[10px] text-gray-500 mt-1">{a.desc}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: Recent Battles */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Battles
                </h3>
                <span className="text-xs text-gray-500 bg-black/20 px-3 py-1 rounded-full">{history.length} matches</span>
              </div>
              <div className="divide-y divide-white/5">
                {history.map((battle) => {
                  const didWin = battle.winnerId === guestId;
                  return (
                    <div key={battle.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors flex items-center gap-4">
                      {/* Win/Loss indicator */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        didWin ? 'bg-yellow-500/10' : 'bg-gray-500/10'
                      }`}>
                        {didWin ? <Trophy className="w-5 h-5 text-yellow-400" /> : <Swords className="w-5 h-5 text-gray-500" />}
                      </div>

                      {/* Problem info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {battle.problems.map(p => (
                            <span key={p.id || p.title} className="text-sm font-semibold text-white">{p.title}</span>
                          ))}
                          {battle.problems.map(p => (
                            <span key={`d-${p.id || p.title}`} className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              p.difficulty === 'EASY' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                              p.difficulty === 'MEDIUM' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                              'border-red-500/30 text-red-400 bg-red-500/10'
                            }`}>
                              {p.difficulty}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {battle.maxPlayers} players
                          </span>
                          {battle.durationSeconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatTime(battle.durationSeconds)}
                            </span>
                          )}
                          <span>{formatDistanceToNow(new Date(battle.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>

                      {/* Outcome */}
                      <div className="shrink-0 text-right">
                        {didWin ? (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">WON</span>
                        ) : (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">LOST</span>
                        )}
                        {!didWin && battle.winner && (
                          <div className="mt-1 text-[10px] text-gray-500">
                            Won by{' '}
                            <Link to={`/battle/user/${battle.winner.id}`} className="text-gray-400 hover:text-white transition-colors">
                              {battle.winner.displayName}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
