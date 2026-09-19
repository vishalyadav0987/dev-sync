import { useState } from "react";
import { Star, MoreHorizontal, Flame, Clock, Pencil, Copy, Archive, Trash2, RotateCcw } from "lucide-react";
import { goalProgress } from "../../lib/sessionHelpers";

export default function SessionCard({ session, onOpen, onToggleFavorite, onDuplicate, onArchive, onRestore, onDelete, streak = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { solved: solvedCount, total, target, percent } = goalProgress(session);
  const inProgress = (session.problems || []).find((p) => p.status === "IN_PROGRESS");
  const isActive = session.status === "ACTIVE";
  const isCompleted = session.status === "COMPLETED";
  const isArchived = session.status === "ARCHIVED";
  const minutes = Math.round((session.totalFocusedSeconds || 0) / 60);

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer backdrop-blur-sm ${
        isActive
          ? "border-indigo-500/40 bg-gradient-to-br from-indigo-500/15 to-violet-500/5 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] hover:border-indigo-400/60 hover:shadow-[0_8px_25px_-4px_rgba(99,102,241,0.25)] hover:-translate-y-0.5"
          : isCompleted
          ? "border-white/5 bg-slate-900/20 opacity-80 hover:opacity-100 hover:border-white/10"
          : "border-white/10 bg-slate-900/40 shadow-sm hover:border-white/20 hover:bg-slate-800/40 hover:-translate-y-0.5 hover:shadow-md"
      }`}
      onClick={() => onOpen(session.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            {session.category || "General"}
          </p>
          <h3 className="mt-0.5 truncate text-base font-bold text-white">{session.title}</h3>
        </div>
        <div className="relative flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavorite(session)}
            className={`rounded-lg p-1.5 transition-colors ${session.isFavorite ? "text-amber-400" : "text-slate-600 hover:text-amber-400"}`}
          >
            <Star className={`h-3.5 w-3.5 ${session.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
          <button onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-1.5 text-slate-600 hover:text-slate-300">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button onClick={() => { setMenuOpen(false); onDuplicate(session); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              {isArchived ? (
                <button onClick={() => { setMenuOpen(false); onRestore(session); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5">
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
              ) : (
                <button onClick={() => { setMenuOpen(false); onArchive(session); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
              )}
              <button onClick={() => { setMenuOpen(false); onDelete(session); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete Forever
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${target > 0 ? percent : 0}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {solvedCount} / {total || target || 0} problems solved
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {minutes} / {session.targetMinutes || "–"} min
        </span>
        {streak > 0 && (
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-amber-400" /> {streak} day streak
          </span>
        )}
      </div>

      {inProgress && (
        <p className="mt-2 truncate rounded-lg bg-black/20 px-2 py-1 text-[11px] text-slate-400">
          Currently solving <span className="text-slate-200">{inProgress.problem.title}</span>
        </p>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen(session.id);
        }}
        className={`mt-3 w-full rounded-lg py-1.5 text-xs font-bold transition-colors ${
          isActive
            ? "bg-indigo-600 text-white hover:bg-indigo-500"
            : isCompleted
            ? "border border-white/10 text-slate-400 hover:text-white"
            : "border border-white/10 text-slate-300 hover:border-indigo-500/40 hover:text-white"
        }`}
      >
        {isCompleted ? "Review" : "Continue"}
      </button>
    </div>
  );
}
