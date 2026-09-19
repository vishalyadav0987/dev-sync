// Single source of truth for Study Session status/stage/note metadata & derived
// stats — used by every Sessions component so business logic like "is this
// problem done" or "what's the goal %" is computed in exactly one place.
import { Check, CircleDashed, CircleDot, X as XIcon, RotateCcw, SkipForward } from "lucide-react";

export const STATUS_META = {
  NOT_STARTED: { icon: CircleDashed, label: "Not Started", color: "text-slate-500", dot: "bg-slate-600" },
  IN_PROGRESS: { icon: CircleDot, label: "In Progress", color: "text-amber-400", dot: "bg-amber-400" },
  SOLVED: { icon: Check, label: "Solved", color: "text-emerald-400", dot: "bg-emerald-400" },
  FAILED: { icon: XIcon, label: "Failed", color: "text-rose-400", dot: "bg-rose-400" },
  REVISIT: { icon: RotateCcw, label: "Revisit", color: "text-violet-400", dot: "bg-violet-400" },
  SKIPPED: { icon: SkipForward, label: "Skipped", color: "text-slate-500", dot: "bg-slate-600" },
};

export const DIFFICULTY_COLOR = { EASY: "text-emerald-400", MEDIUM: "text-amber-400", HARD: "text-rose-400" };
export const DIFFICULTY_BG = { EASY: "bg-emerald-500/10", MEDIUM: "bg-amber-500/10", HARD: "bg-rose-500/10" };

export const STAGES = [
  { key: "understanding", label: "Understand" },
  { key: "approach", label: "Approach" },
  { key: "implementation", label: "Implement" },
  { key: "testing", label: "Test" },
  { key: "solved", label: "Solved" },
];

export const NOTE_TYPES = [
  { key: "important", label: "Important", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { key: "mistake", label: "Mistake", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { key: "confusing", label: "Confusing", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { key: "insight", label: "Insight", color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
  { key: "revision", label: "Revision", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
];

export function fmtClock(totalSeconds = 0) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function fmtMinutes(totalSeconds = 0) {
  return Math.round(totalSeconds / 60);
}

// The single place that derives "what should the learner do next" for a session.
export function deriveNextAction(session) {
  const problems = session.problems || [];
  const inProgress = problems.find((p) => p.status === "IN_PROGRESS");
  if (inProgress) return { label: `Finish ${inProgress.problem.title}`, problem: inProgress };

  const revisit = problems.find((p) => p.status === "REVISIT");
  if (revisit) return { label: `Retry ${revisit.problem.title}`, problem: revisit };

  const notStarted = problems.slice().sort((a, b) => a.order - b.order).find((p) => p.status === "NOT_STARTED");
  if (notStarted) return { label: `Start ${notStarted.problem.title}`, problem: notStarted };

  return null;
}

// Works against either the lightweight list shape ({ progress: {...} }, no
// `problems` array) or the full session-detail shape (`problems` array) —
// the two API responses used across the Sessions feature.
export function goalProgress(session) {
  const solved = session.problems ? session.problems.filter((p) => p.status === "SOLVED").length : session.progress?.solved ?? 0;
  const total = session.problems ? session.problems.length : session.progress?.total ?? 0;
  const target = session.targetProblems || total || 0;
  const percent = target > 0 ? Math.min(100, Math.round((solved / target) * 100)) : 0;
  return { solved, total, target, percent };
}

export function weekdayLabels() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}
