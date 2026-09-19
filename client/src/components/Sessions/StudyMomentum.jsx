import { Flame } from "lucide-react";
import { weekdayLabels } from "../../lib/sessionHelpers";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Renders a 7-day streak strip. `activeDays` is a Set of `toDateString()`
 * values (days the learner solved at least one problem) — the caller derives
 * this once from session/activity data so this component stays presentational.
 */
export default function StudyMomentum({ streak = 0, activeDays = new Set(), weeklyRemaining = null }) {
  const days = weekdayLabels();
  const today = new Date().toDateString();

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        Study Momentum
      </p>
      <div className="mb-3 flex items-center gap-1.5">
        <Flame className={`h-4 w-4 ${streak > 0 ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
        <span className="text-sm font-bold text-white">{streak} day streak</span>
      </div>
      <div className="flex items-center justify-between">
        {days.map((d, i) => {
          const key = d.toDateString();
          const isToday = key === today;
          const active = activeDays.has(key);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-slate-600">{DOW[d.getDay()]}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active
                    ? "bg-amber-400 text-slate-950"
                    : isToday
                    ? "border border-dashed border-indigo-400 text-indigo-300"
                    : "bg-slate-800 text-slate-600"
                }`}
              >
                {active ? "●" : isToday ? "◐" : "○"}
              </span>
            </div>
          );
        })}
      </div>
      {weeklyRemaining != null && weeklyRemaining > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          You're <span className="font-semibold text-white">{weeklyRemaining} problem{weeklyRemaining === 1 ? "" : "s"}</span> away from your weekly target.
        </p>
      )}
    </div>
  );
}
