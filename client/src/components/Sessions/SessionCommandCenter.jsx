import { Play, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import SessionCard from "./SessionCard";
import StudyMomentum from "./StudyMomentum";
import { fmtMinutes, goalProgress } from "../../lib/sessionHelpers";

function TodayHeader({ session, onOpen }) {
  if (!session) return null;
  const { solved, target } = goalProgress(session);
  return (
    <div className="relative mb-6 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-5 shadow-lg shadow-indigo-500/5 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent"></div>
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div className="relative min-w-0 flex-1">
        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
          <Sparkles className="h-3 w-3" /> Today's Focus
        </p>
        <h2 className="truncate text-xl font-bold tracking-tight text-white">{session.title}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {session.category || "General"} · {solved}/{target || "–"} solved · {fmtMinutes(session.totalFocusedSeconds)} min
        </p>
      </div>
      <button
        onClick={() => onOpen(session.id)}
        className="group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
      >
        <span className="relative z-10 flex items-center gap-2">
          <Play className="h-4 w-4 fill-white/20 transition-transform group-hover:scale-110" /> Continue Session
        </span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
      </button>
    </div>
  );
}

function InsightsPanel({ insights, onRecommendationClick }) {
  return (
    <aside className="hidden w-72 shrink-0 space-y-4 xl:block">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Today's Momentum</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xl font-bold text-white">{insights?.today?.solved ?? 0}</p>
            <p className="text-[11px] text-slate-500">Problems Solved</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{fmtMinutes(insights?.today?.focusSeconds ?? 0)}m</p>
            <p className="text-[11px] text-slate-500">Focus Time</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{insights?.today?.successRate ?? "–"}{insights?.today?.successRate != null ? "%" : ""}</p>
            <p className="text-[11px] text-slate-500">Success Rate</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">🔥 {insights?.today?.streak ?? 0}</p>
            <p className="text-[11px] text-slate-500">Day Streak</p>
          </div>
        </div>
      </div>

      <StudyMomentum streak={insights?.today?.streak ?? 0} />

      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Recommended Next
        </p>
        <ul className="space-y-2">
          {(insights?.recommendations ?? []).map((rec, i) => (
            <li key={i}>
              <button
                onClick={() => onRecommendationClick?.(rec)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-white/5"
              >
                <span className="flex items-center gap-1.5">
                  {rec.type === "review_mistakes" && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />}
                  {rec.label}
                </span>
                <ArrowRight className="h-3 w-3 shrink-0 text-slate-600" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default function SessionCommandCenter({ sessions, insights, onOpen, onToggleFavorite, onDuplicate, onArchive, onRestore, onDelete, onCreate, onRecommendationClick }) {
  const active = sessions.filter((s) => s.status === "ACTIVE");
  const others = sessions.filter((s) => s.status !== "ACTIVE");
  const todaysSession = active[0];

  if (sessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/60 bg-gradient-to-b from-slate-800/30 to-transparent px-6 py-16 text-center backdrop-blur-sm">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] border border-indigo-500/20">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl"></div>
          <Sparkles className="relative h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">No study sessions yet</h2>
        <p className="mt-3 max-w-sm text-sm text-slate-400">Your next breakthrough starts with a single focused session. Set your goals and track your progress.</p>
        <button onClick={onCreate} className="group relative mt-8 overflow-hidden rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <span className="relative z-10 flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Create Session
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full gap-6">
      <div className="min-w-0 flex-1">
        <TodayHeader session={todaysSession} onOpen={onOpen} />

        {active.length > 0 && (
          <>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Active Sessions</p>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {active.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onOpen={onOpen}
                  onToggleFavorite={onToggleFavorite}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                  streak={insights?.today?.streak ?? 0}
                />
              ))}
            </div>
          </>
        )}

        {others.length > 0 && (
          <>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Other Sessions</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {others.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onOpen={onOpen}
                  onToggleFavorite={onToggleFavorite}
                  onDuplicate={onDuplicate}
                  onArchive={onArchive}
                  onRestore={onRestore}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <InsightsPanel insights={insights} onRecommendationClick={onRecommendationClick} />
    </div>
  );
}
