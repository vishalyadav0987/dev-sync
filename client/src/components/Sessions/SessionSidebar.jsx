import { useMemo } from "react";
import { Search, Star, Plus } from "lucide-react";
import { formatDistanceToNowStrict, isToday, isThisWeek } from "date-fns";

function groupSessions(sessions) {
  const groups = { Today: [], "This Week": [], Older: [] };
  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (isToday(d)) groups.Today.push(s);
    else if (isThisWeek(d)) groups["This Week"].push(s);
    else groups.Older.push(s);
  }
  return groups;
}

function SessionRow({ session, isActive, onSelect }) {
  const { progress } = session;
  return (
    <button
      onClick={() => onSelect(session.id)}
      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? "bg-indigo-500/15 ring-1 ring-indigo-500/40" : "hover:bg-white/5"
        }`}
    >
      <div className="flex items-center gap-1.5">
        {session.isFavorite && <Star className="w-3 h-3 shrink-0 fill-amber-400 text-amber-400" />}
        <span className={`truncate text-sm font-semibold ${isActive ? "text-indigo-300" : "text-slate-200"}`}>{session.title}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
        <span>
          {progress.solved}/{progress.total || 0} problems
        </span>
        <span>·</span>
        <span>{progress.percent}%</span>
        <span>·</span>
        <span>{formatDistanceToNowStrict(new Date(session.updatedAt), { addSuffix: true })}</span>
      </div>
      {progress.total > 0 && (
        <div className="mt-1.5 h-1 w-full rounded-full bg-slate-800">
          <div className="h-1 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      )}
    </button>
  );
}

export default function SessionSidebar({ sessions, activeId, search, onSearch, onSelect, onCreate, filter, onFilterChange, quickFilter, onQuickFilterChange, topics = [] }) {
  const groups = useMemo(() => groupSessions(sessions), [sessions]);
  const quickChips = useMemo(() => ["Today", "This Week", ...topics.slice(0, 5)], [topics]);

  return (
    <aside className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={onCreate}
          title="New Session"
          className="flex shrink-0 items-center justify-center rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
        {["all", "active", "completed", "favorites", "archived"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`shrink-0 rounded-full px-2.5 py-1 font-semibold capitalize transition-colors ${filter === f ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {quickChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-3 text-[11px]">
          <p className="w-full text-[10px] font-bold uppercase tracking-widest text-slate-600">Quick Filters</p>
          {quickChips.map((f) => (
            <button
              key={f}
              onClick={() => onQuickFilterChange(quickFilter === f ? null : f)}
              className={`rounded-full px-2 py-1 font-semibold transition-colors ${quickFilter === f ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-slate-500 hover:text-slate-300"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {sessions.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-slate-500">No sessions match.</p>
        )}
        {Object.entries(groups).map(([label, items]) =>
          items.length ? (
            <div key={label}>
              <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
              <div className="space-y-1">
                {items.map((s) => (
                  <SessionRow key={s.id} session={s} isActive={s.id === activeId} onSelect={onSelect} />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </aside>
  );
}