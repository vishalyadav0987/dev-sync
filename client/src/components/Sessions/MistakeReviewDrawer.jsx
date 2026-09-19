import { useState } from "react";
import { X, AlertTriangle, Check } from "lucide-react";
import { api } from "../../lib/api";

function ConfidenceDots({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-6 w-6 rounded-full border text-[11px] font-semibold transition-colors ${
            value >= n ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-700 text-slate-500 hover:border-slate-500"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function NewMistakeForm({ session, problem, onSaved }) {
  const [mistake, setMistake] = useState("");
  const [reason, setReason] = useState("");
  const [correctConcept, setCorrectConcept] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!mistake.trim() || saving) return;
    setSaving(true);
    try {
      await api.createMistake(session.id, {
        problemId: problem.problemId,
        mistake: mistake.trim(),
        reason: reason.trim() || undefined,
        correctConcept: correctConcept.trim() || undefined,
        confidence: confidence || undefined,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-rose-300">
        <AlertTriangle className="h-4 w-4" /> Mistake Review — {problem.problem.title}
      </p>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">What went wrong?</label>
        <textarea value={mistake} onChange={(e) => setMistake(e.target.value)} rows={2} autoFocus className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">Why?</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-400">Correct concept</label>
        <textarea value={correctConcept} onChange={(e) => setCorrectConcept(e.target.value)} rows={2} className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-400">Confidence</label>
        <ConfidenceDots value={confidence} onChange={setConfidence} />
      </div>
      <button disabled={!mistake.trim() || saving} className="w-full rounded-lg bg-rose-600 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition-colors">
        {saving ? "Saving…" : "Save Mistake Review"}
      </button>
    </form>
  );
}

export default function MistakeReviewDrawer({ session, mistakes, pendingProblem, onClose, onChanged }) {
  const markReviewed = async (m) => {
    await api.updateMistake(session.id, m.id, { isReviewed: true });
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-bold text-white">Mistake Review</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {pendingProblem && <NewMistakeForm session={session} problem={pendingProblem} onSaved={onChanged} />}

          {(mistakes || []).length === 0 && !pendingProblem ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-300">No mistakes logged</p>
              <p className="mt-1 text-xs text-slate-500">When a problem doesn't go as planned, capture what happened here.</p>
            </div>
          ) : (
            (mistakes || []).map((m) => (
              <div key={m.id} className={`rounded-xl border p-3 ${m.isReviewed ? "border-white/5 bg-slate-900/30 opacity-70" : "border-amber-500/20 bg-amber-500/5"}`}>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-400">{m.problem?.title}</p>
                <p className="mt-1 text-sm text-slate-200">{m.mistake}</p>
                {m.reason && <p className="mt-1 text-xs text-slate-400">Why: {m.reason}</p>}
                {m.correctConcept && <p className="mt-1 text-xs text-emerald-300">Concept: {m.correctConcept}</p>}
                {!m.isReviewed && (
                  <button onClick={() => markReviewed(m)} className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600/25 transition-colors">
                    <Check className="h-3 w-3" /> Mark Reviewed
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
