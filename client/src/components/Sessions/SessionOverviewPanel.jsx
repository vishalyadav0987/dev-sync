import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ListChecks, Clock, Percent, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { api } from "../../lib/api";
import { fmtMinutes, goalProgress } from "../../lib/sessionHelpers";

const ACTIVITY_LABEL = {
  SESSION_STARTED: "Started session",
  SESSION_PAUSED: "Paused session",
  SESSION_RESUMED: "Resumed session",
  PROBLEM_STARTED: "Started a problem",
  PROBLEM_SOLVED: "Solved a problem",
  PROBLEM_FAILED: "Failed a problem",
  PROBLEM_SKIPPED: "Skipped a problem",
  MISTAKE_CREATED: "Logged a mistake",
  SESSION_COMPLETED: "Completed session",
};

export default function SessionOverviewPanel({ session }) {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getSessionAnalytics(session.id).then((data) => alive && setAnalytics(data));
    return () => {
      alive = false;
    };
  }, [session.id]);

  const { solved, target, percent } = goalProgress(session);

  return (
    <div className="space-y-5 overflow-y-auto p-5">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Session Progress</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="flex items-center gap-1 text-[11px] text-slate-500"><ListChecks className="h-3 w-3" /> Problems</p>
            <p className="mt-1 text-lg font-bold text-white">{solved} / {target || "–"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="flex items-center gap-1 text-[11px] text-slate-500"><Clock className="h-3 w-3" /> Focus</p>
            <p className="mt-1 text-lg font-bold text-white">{fmtMinutes(session.totalFocusedSeconds)} / {session.targetMinutes || "–"} min</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <p className="flex items-center gap-1 text-[11px] text-slate-500"><Percent className="h-3 w-3" /> Success</p>
            <p className="mt-1 text-lg font-bold text-white">{analytics?.successRate ?? "–"}{analytics?.successRate != null ? "%" : ""}</p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Session Timeline</p>
        {!analytics?.timeline?.length ? (
          <p className="text-xs text-slate-500">Nothing happened yet — start solving to build a timeline.</p>
        ) : (
          <ul className="space-y-2 border-l border-white/10 pl-3">
            {analytics.timeline.slice(-12).map((ev, i) => (
              <li key={i} className="text-xs text-slate-400">
                <span className="text-slate-600">{format(new Date(ev.at), "HH:mm")}</span>{" "}
                {ACTIVITY_LABEL[ev.type] || ev.type}
              </li>
            ))}
          </ul>
        )}
      </div>

      {analytics && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Performance</p>
          <div className="grid gap-2 sm:grid-cols-2 text-sm text-slate-300">
            <p>Problems solved: <span className="font-semibold text-white">{analytics.problemsSolved}</span></p>
            <p>Failed attempts: <span className="font-semibold text-white">{analytics.problemsFailed}</span></p>
            <p>Avg solve time: <span className="font-semibold text-white">{fmtMinutes(analytics.avgSolveTimeSeconds)}m</span></p>
            <p>Focus time: <span className="font-semibold text-white">{fmtMinutes(analytics.totalFocusSeconds)}m</span></p>
          </div>
        </div>
      )}

      {analytics && (analytics.mostPracticedTopics?.length > 0 || analytics.weakTopics?.length > 0) && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">Learning Signals</p>
          <ul className="space-y-1.5 text-sm">
            {analytics.mostPracticedTopics?.slice(0, 2).map((t) => (
              <li key={t.topic} className="flex items-center gap-1.5 text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" /> Strong — {t.topic}
              </li>
            ))}
            {analytics.weakTopics?.map((t) => (
              <li key={t.topic} className="flex items-center gap-1.5 text-rose-300">
                <TrendingDown className="h-3.5 w-3.5" /> Needs review — {t.topic}
              </li>
            ))}
            {!analytics.mostPracticedTopics?.length && !analytics.weakTopics?.length && (
              <li className="flex items-center gap-1.5 text-slate-500">
                <Minus className="h-3.5 w-3.5" /> Not enough data yet
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
