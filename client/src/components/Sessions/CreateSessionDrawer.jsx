import { useState } from "react";
import { X, Zap, Target, Flame, Brain, Trophy, RotateCcw } from "lucide-react";

const TEMPLATES = [
  {
    key: "quick",
    icon: Zap,
    label: "30 Min Practice",
    build: () => ({ title: "30 Min Practice", targetMinutes: 30, targetProblems: 2, difficulty: "MIXED", focusMode: false }),
  },
  {
    key: "interview",
    icon: Target,
    label: "Interview Prep",
    build: () => ({ title: "Interview Prep", targetMinutes: 60, targetProblems: 3, difficulty: "HARD", focusMode: true }),
  },
  {
    key: "daily",
    icon: Flame,
    label: "Daily DSA",
    build: () => ({ title: "Daily DSA", targetMinutes: 45, targetProblems: 3, difficulty: "MIXED", focusMode: false }),
  },
  {
    key: "concept",
    icon: Brain,
    label: "Concept Revision",
    build: () => ({ title: "Concept Revision", targetMinutes: 30, difficulty: "EASY", focusMode: false, goalLabel: "Revise core concepts" }),
  },
  {
    key: "contest",
    icon: Trophy,
    label: "Contest Prep",
    build: () => ({ title: "Contest Preparation", targetMinutes: 90, targetProblems: 6, difficulty: "HARD", focusMode: true }),
  },
  {
    key: "weak",
    icon: RotateCcw,
    label: "Weak Topics",
    build: () => ({ title: "Weak Topics Revision", targetMinutes: 45, targetProblems: 3, difficulty: "MIXED", focusMode: false, goalLabel: "Retry previously failed problems" }),
  },
];

const empty = { title: "", category: "", goalLabel: "", targetProblems: "", targetMinutes: "60", difficulty: "MIXED", focusMode: false };

export default function CreateSessionDrawer({ onClose, onCreate }) {
  const [form, setForm] = useState(empty);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));

  const applyTemplate = (tpl) => {
    setActiveTemplate(tpl.key);
    setForm((f) => ({ ...empty, ...f, ...tpl.build() }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({
        title: form.title.trim(),
        category: form.category || undefined,
        goalLabel: form.goalLabel || undefined,
        targetProblems: form.targetProblems ? Number(form.targetProblems) : undefined,
        targetMinutes: form.targetMinutes ? Number(form.targetMinutes) : undefined,
        difficulty: form.difficulty,
        focusMode: form.focusMode,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-white">Create Study Session</h2>
            <p className="mt-0.5 text-sm text-slate-400">Plan your next focused DSA session</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Quick Start</p>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isActive = activeTemplate === tpl.key;
              return (
                <button
                  type="button"
                  key={tpl.key}
                  onClick={() => applyTemplate(tpl)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors ${
                    isActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-slate-900/50 hover:border-indigo-500/40 hover:bg-slate-800"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-300" : "text-indigo-400"}`} />
                  <span className="text-[11px] font-medium leading-tight text-slate-300">{tpl.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">What do you want to accomplish?</label>
              <input
                autoFocus
                value={form.title}
                onChange={set("title")}
                placeholder="Backtracking Practice"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Topic</label>
                <input
                  value={form.category}
                  onChange={set("category")}
                  placeholder="Backtracking"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Goal (optional)</label>
                <input
                  value={form.goalLabel}
                  onChange={set("goalLabel")}
                  placeholder="Solve 3 problems"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Target Problems</label>
                <input
                  type="number"
                  min="0"
                  value={form.targetProblems}
                  onChange={set("targetProblems")}
                  placeholder="5"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Duration (min)</label>
                <input
                  type="number"
                  min="0"
                  value={form.targetMinutes}
                  onChange={set("targetMinutes")}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Difficulty</label>
              <div className="flex gap-2">
                {["EASY", "MEDIUM", "HARD", "MIXED"].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setForm((f) => ({ ...f, difficulty: d }))}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                      form.difficulty === d ? "border-indigo-500 bg-indigo-500/10 text-indigo-300" : "border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {d[0] + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.focusMode} onChange={set("focusMode")} className="rounded border-slate-600 bg-slate-900 text-indigo-500" />
              Focus Mode — hide distractions while this session runs
            </label>
          </form>
        </div>

        <div className="border-t border-white/10 px-6 py-4">
          <button
            onClick={submit}
            disabled={!form.title.trim() || saving}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
