import { Play, Pause, StickyNote, AlertTriangle, Target as TargetIcon, ArrowRight } from "lucide-react";
import { fmtClock, goalProgress, deriveNextAction } from "../../lib/sessionHelpers";

export default function SessionControlPanel({ session, timer, mistakes, onOpenNotes, onOpenMistakes, onFinish }) {
  const { solved, target, percent } = goalProgress(session);
  const nextAction = deriveNextAction(session);
  const unresolvedMistakes = (mistakes || []).filter((m) => !m.isReviewed);

  const failedTopics = {};
  for (const p of session.problems || []) {
    if (p.status === "FAILED") {
      const topic = p.problem.tags?.[0] || session.category || "General";
      failedTopics[topic] = (failedTopics[topic] || 0) + 1;
    }
  }
  const weakestTopic = Object.entries(failedTopics).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Focus Timer</p>
        <p className="font-mono text-3xl font-bold text-white">{fmtClock(timer.totalSeconds + timer.seconds)}</p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={timer.isRunning ? timer.pause : timer.start}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              timer.isRunning ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
            }`}
          >
            {timer.isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {timer.isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={onFinish} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-rose-500/40 hover:text-rose-300 transition-colors">
            Finish Session
          </button>
        </div>
        {session.targetMinutes && Math.round((timer.totalSeconds + timer.seconds) / 60) >= session.targetMinutes && (
          <p className="mt-2 rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-[11px] text-indigo-300">
            Your planned focus time is complete — keep going or finish up.
          </p>
        )}
      </div>

      <div className="border-t border-white/5 pt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          <TargetIcon className="h-3.5 w-3.5" /> Session Goal
        </p>
        <p className="text-sm text-slate-300">
          {solved} / {target || "–"}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <button onClick={onOpenNotes} className="flex items-center justify-between border-t border-white/5 pt-4 text-left">
        <span className="flex items-center gap-1.5 text-sm text-slate-300">
          <StickyNote className="h-3.5 w-3.5 text-slate-500" /> Session Notes
        </span>
        <span className="text-xs text-slate-500">{session.notes?.length ?? 0} notes</span>
      </button>

      <button onClick={onOpenMistakes} className="flex items-center justify-between text-left">
        <span className="flex items-center gap-1.5 text-sm text-slate-300">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Mistakes
        </span>
        <span className="text-xs text-slate-500">
          {mistakes?.length ?? 0}
          {unresolvedMistakes.length > 0 && <span className="ml-1 text-amber-400">({unresolvedMistakes.length} to review)</span>}
        </span>
      </button>

      {weakestTopic && (
        <div className="border-t border-white/5 pt-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Weak Area</p>
          <p className="text-sm text-slate-300">{weakestTopic}</p>
        </div>
      )}

      {nextAction && (
        <div className="mt-auto rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-indigo-400">Next Action</p>
          <p className="flex items-center gap-1 text-sm text-slate-200">
            {nextAction.label} <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
          </p>
        </div>
      )}
    </div>
  );
}
