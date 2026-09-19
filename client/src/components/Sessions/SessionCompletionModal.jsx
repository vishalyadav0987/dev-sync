import { useState } from "react";
import { Check, X as XIcon, Circle } from "lucide-react";
import { api } from "../../lib/api";
import { fmtMinutes } from "../../lib/sessionHelpers";

const STATUS_ICON = { SOLVED: Check, FAILED: XIcon };

export default function SessionCompletionModal({ session, onClose, onCompleted }) {
  const [reflection, setReflection] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [revisit, setRevisit] = useState(new Set());
  const [saving, setSaving] = useState(false);

  const problems = session.problems || [];
  const solved = problems.filter((p) => p.status === "SOLVED");
  const completionPercent = session.targetProblems ? Math.min(100, Math.round((solved.length / session.targetProblems) * 100)) : problems.length ? Math.round((solved.length / problems.length) * 100) : 0;

  const toggleRevisit = (problemId) =>
    setRevisit((prev) => {
      const next = new Set(prev);
      next.has(problemId) ? next.delete(problemId) : next.add(problemId);
      return next;
    });

  const submit = async () => {
    setSaving(true);
    try {
      const { summary } = await api.completeSession(session.id, {
        reflection: reflection.trim() || undefined,
        confidence: confidence || undefined,
        revisitProblemIds: Array.from(revisit),
      });
      onCompleted(summary);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white/10 px-6 py-5 text-center">
          <p className="text-2xl">🎉</p>
          <h2 className="mt-1 text-lg font-bold text-white">Session Complete</h2>
          <p className="text-sm text-slate-400">{session.title}</p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[11px] text-slate-500">Planned</p>
              <p className="text-sm font-semibold text-white">
                {session.targetMinutes || "–"} min · {session.targetProblems || "–"} problems
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
              <p className="text-[11px] text-slate-500">Completed</p>
              <p className="text-sm font-semibold text-white">
                {fmtMinutes(session.totalFocusedSeconds)} min · {solved.length} problems ({completionPercent}%)
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Problems</p>
            <ul className="space-y-1">
              {problems.map((p) => {
                const Icon = STATUS_ICON[p.status] || Circle;
                return (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <Icon className={`h-3.5 w-3.5 ${p.status === "SOLVED" ? "text-emerald-400" : p.status === "FAILED" ? "text-rose-400" : "text-slate-600"}`} />
                    <span className="text-slate-300">{p.problem.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">What did you learn?</label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              placeholder="Write a short reflection…"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">Confidence</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setConfidence(n)}
                  className={`h-8 w-8 rounded-full border text-xs font-semibold transition-colors ${
                    confidence >= n ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-700 text-slate-500 hover:border-slate-500"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {(problems.some((p) => p.status === "FAILED") || solved.length < problems.length) && (
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-slate-500">What should you revisit?</label>
              <div className="space-y-1.5">
                {problems
                  .filter((p) => p.status !== "SOLVED")
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={revisit.has(p.problemId)} onChange={() => toggleRevisit(p.problemId)} className="rounded border-slate-600 bg-slate-900 text-indigo-500" />
                      {p.problem.title}
                    </label>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-6 py-4">
          <button onClick={submit} disabled={saving} className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors">
            {saving ? "Saving…" : "Complete Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
