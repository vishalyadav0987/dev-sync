import { useEffect, useMemo, useRef, useState } from "react";
import { Search, GripVertical, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { STATUS_META, DIFFICULTY_COLOR } from "../../lib/sessionHelpers";

const SEARCH_DEBOUNCE_MS = 300;

export default function ProblemQueuePanel({ session, currentProblemId, onSelect, onChanged }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const dragIndex = useRef(null);
  const debounceRef = useRef(null);
  const requestSeq = useRef(0);

  const problems = session.problems || [];
  const solved = problems.filter((p) => p.status === "SOLVED").length;
  const inProgress = problems.filter((p) => p.status === "IN_PROGRESS").length;
  const existingIds = useMemo(() => new Set(problems.map((p) => p.problemId)), [problems]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const runSearch = (q) => {
    setQuery(q);
    clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      try {
        const res = await api.getProblems({ search: q });
        if (seq !== requestSeq.current) return; // a newer keystroke already superseded this request
        setResults(res.filter((p) => !existingIds.has(p.id)).slice(0, 6));
      } finally {
        if (seq === requestSeq.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const addProblem = async (problemId) => {
    await api.addSessionProblems(session.id, [problemId]);
    setQuery("");
    setResults([]);
    onChanged();
  };

  const remove = async (sp, e) => {
    e.stopPropagation();
    await api.removeSessionProblem(session.id, sp.problemId);
    onChanged();
  };

  const onDragStart = (i) => (e) => {
    dragIndex.current = i;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (i) => (e) => e.preventDefault();
  const onDrop = (i) => async (e) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === i) return;
    const reordered = [...problems];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(i, 0, moved);
    dragIndex.current = null;
    await api.reorderSessionProblems(session.id, reordered.map((p) => p.problemId));
    onChanged();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Problem Queue</p>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Add a problem…"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2 text-xs text-white outline-none focus:border-indigo-500"
          />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProblem(p.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/5"
                >
                  <span className="truncate text-slate-200">{p.title}</span>
                  <span className={`shrink-0 font-semibold ${DIFFICULTY_COLOR[p.difficulty]}`}>{p.difficulty}</span>
                </button>
              ))}
            </div>
          )}
          {searching && <p className="mt-1 text-[11px] text-slate-500">Searching…</p>}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {problems.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-semibold text-slate-300">Your queue is empty</p>
            <p className="mt-1 text-xs text-slate-500">Add problems to build your study path.</p>
          </div>
        ) : (
          problems.map((sp, i) => {
            const meta = STATUS_META[sp.status] || STATUS_META.NOT_STARTED;
            const Icon = meta.icon;
            const isCurrent = sp.problemId === currentProblemId;
            return (
              <div
                key={sp.id}
                draggable
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                onDrop={onDrop(i)}
                onClick={() => onSelect(sp)}
                className={`group flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${isCurrent ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/5 hover:border-white/15 hover:bg-white/5"
                  }`}
              >
                <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-slate-700" />
                <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                <span className={`min-w-0 flex-1 truncate text-sm ${isCurrent ? "font-semibold text-white" : "text-slate-300"}`}>
                  {sp.problem.title}
                </span>
                <span className={`shrink-0 text-[10px] font-bold uppercase ${DIFFICULTY_COLOR[sp.problem.difficulty]}`}>
                  {sp.problem.difficulty?.[0]}
                </span>
                <button onClick={(e) => remove(sp, e)} className="shrink-0 text-slate-700 opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {problems.length > 0 && (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[11px] text-slate-500">
          <span>{solved} solved</span>
          <span>{inProgress} in progress</span>
          <span>{problems.length - solved - inProgress} remaining</span>
        </div>
      )}
    </div>
  );
}