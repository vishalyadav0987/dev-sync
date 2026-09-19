import { useEffect, useMemo, useState } from "react";
import Split from "react-split";
import { ArrowLeft, Star, MoreHorizontal, Pencil, Copy, Archive, Trash2, LayoutGrid, ListTree } from "lucide-react";
import { api } from "../../lib/api";
import { useSessionTimer } from "../../hooks/useSessionTimer";
import ProblemQueuePanel from "./ProblemQueuePanel";
import CurrentProblemPanel from "./CurrentProblemPanel";
import SessionControlPanel from "./SessionControlPanel";
import SessionOverviewPanel from "./SessionOverviewPanel";
import NotesDrawer from "./NotesDrawer";
import MistakeReviewDrawer from "./MistakeReviewDrawer";
import SessionCompletionModal from "./SessionCompletionModal";
import ConfirmDialog from "./ConfirmDialog";
import { fmtMinutes, goalProgress } from "../../lib/sessionHelpers";

// Split pane UI handled by react-split

export default function SessionWorkspace({ sessionId, onBack, onSessionChanged }) {
  const [session, setSession] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [view, setView] = useState("focus"); // "focus" | "overview"
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [pendingMistakeProblem, setPendingMistakeProblem] = useState(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionSummary, setCompletionSummary] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    const detail = await api.getSession(sessionId);
    setSession(detail);
    setSelectedProblemId((prev) => prev ?? detail.currentProblemId ?? detail.continueState?.problem?.problemId ?? detail.problems[0]?.problemId ?? null);
  };

  const loadMistakes = async () => {
    const { mistakes } = await api.getSessionMistakes(sessionId);
    setMistakes(mistakes);
  };

  useEffect(() => {
    setSelectedProblemId(null);
    load();
    loadMistakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const timer = useSessionTimer(sessionId, session?.totalFocusedSeconds || 0);

  const refresh = () => {
    load();
    onSessionChanged?.();
  };

  const current = useMemo(() => session?.problems.find((p) => p.problemId === selectedProblemId) || null, [session, selectedProblemId]);

  if (!session) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Loading workspace…</div>;
  }

  const { solved, target } = goalProgress(session);
  const totalSeconds = timer.totalSeconds + timer.seconds;

  const toggleFavorite = async () => {
    await api.updateSession(session.id, { isFavorite: !session.isFavorite });
    refresh();
  };

  const submitRename = async (e) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    await api.updateSession(session.id, { title: renameValue.trim() });
    setRenaming(false);
    refresh();
  };

  const duplicate = async () => {
    setMenuOpen(false);
    const copy = await api.duplicateSession(session.id, { copyNotes: false });
    onSessionChanged?.();
    onBack(copy.id);
  };

  const archive = async () => {
    setConfirmDelete(null);
    await api.archiveSession(session.id);
    onSessionChanged?.();
    onBack();
  };

  const deleteForever = async () => {
    setConfirmDelete(null);
    await api.deleteSessionForever(session.id);
    onSessionChanged?.();
    onBack();
  };

  const handleFinish = () => {
    timer.pause();
    setShowCompletion(true);
  };

  const handleCompleted = (summary) => {
    setCompletionSummary(summary);
    setShowCompletion(false);
    refresh();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-1 pb-4">
        <div className="flex min-w-0 items-start gap-2">
          <button onClick={() => onBack()} className="mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors" title="Back to sessions">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            {renaming ? (
              <form onSubmit={submitRename}>
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={submitRename}
                  className="rounded-lg border border-indigo-500 bg-slate-950 px-2 py-1 text-lg font-bold text-white outline-none"
                />
              </form>
            ) : (
              <h1 className="flex items-center gap-2 truncate text-xl font-bold text-white">
                {session.isFavorite && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />}
                {session.title}
              </h1>
            )}
            <p className="mt-0.5 text-xs text-slate-500">
              {session.category || "General"} · {session.difficulty} · {solved}/{target || "–"} solved · {fmtMinutes(totalSeconds)} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mr-1 flex rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setView("focus")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${view === "focus" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Focus
            </button>
            <button
              onClick={() => setView("overview")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${view === "overview" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              <ListTree className="h-3.5 w-3.5" /> Overview
            </button>
          </div>

          <button
            onClick={toggleFavorite}
            className={`rounded-lg p-2 transition-colors ${session.isFavorite ? "text-amber-400 hover:bg-amber-500/10" : "text-slate-500 hover:bg-white/5"}`}
          >
            <Star className={`h-4 w-4 ${session.isFavorite ? "fill-amber-400" : ""}`} />
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl" onMouseLeave={() => setMenuOpen(false)}>
                <button onClick={() => { setRenaming(true); setRenameValue(session.title); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5">
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </button>
                <button onClick={duplicate} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button onClick={() => { setMenuOpen(false); setConfirmDelete({ permanent: false }); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5">
                  <Archive className="h-3.5 w-3.5" /> Archive
                </button>
                <button onClick={() => { setMenuOpen(false); setConfirmDelete({ permanent: true }); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 pt-3">
        {view === "overview" ? (
          <div className="h-full overflow-y-auto rounded-xl border border-white/10 bg-slate-900/30">
            <SessionOverviewPanel session={session} />
          </div>
        ) : (
          <Split
            className="flex h-full w-full"
            sizes={[24, 52, 24]}
            minSize={[200, 350, 200]}
            gutterSize={8}
            direction="horizontal"
          >
            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/30">
              <ProblemQueuePanel session={session} currentProblemId={selectedProblemId} onSelect={(sp) => setSelectedProblemId(sp.problemId)} onChanged={refresh} />
            </div>
            
            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/30">
              <CurrentProblemPanel
                session={session}
                current={current}
                onChanged={refresh}
                onMarkFailed={(problem) => {
                  setPendingMistakeProblem(problem);
                  setShowMistakes(true);
                }}
              />
            </div>

            <div className="h-full min-w-0 overflow-hidden rounded-xl border border-white/10 bg-slate-900/30">
              <SessionControlPanel
                session={session}
                timer={timer}
                mistakes={mistakes}
                onOpenNotes={() => setShowNotes(true)}
                onOpenMistakes={() => { setPendingMistakeProblem(null); setShowMistakes(true); }}
                onFinish={handleFinish}
              />
            </div>
          </Split>
        )}
      </div>

      {showNotes && <NotesDrawer session={session} onClose={() => setShowNotes(false)} onChanged={refresh} />}
      {showMistakes && (
        <MistakeReviewDrawer
          session={session}
          mistakes={mistakes}
          pendingProblem={pendingMistakeProblem}
          onClose={() => { setShowMistakes(false); setPendingMistakeProblem(null); }}
          onChanged={() => { loadMistakes(); refresh(); }}
        />
      )}
      {showCompletion && <SessionCompletionModal session={session} onClose={() => setShowCompletion(false)} onCompleted={handleCompleted} />}
      {completionSummary && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setCompletionSummary(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-950 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-2xl">✅</p>
            <h3 className="mt-2 text-lg font-bold text-white">Nice work!</h3>
            <p className="mt-1 text-sm text-slate-400">
              You solved {completionSummary.completedProblems} problem{completionSummary.completedProblems === 1 ? "" : "s"} in {completionSummary.actualMinutes} minutes.
            </p>
            <button onClick={() => { setCompletionSummary(null); onBack(); }} className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors">
              Back to Sessions
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete?.permanent ? `Delete "${session.title}" forever?` : `Archive "${session.title}"?`}
        description={confirmDelete?.permanent ? "This permanently removes the session and its problem queue. This can't be undone." : "The session and its progress are kept and can be restored later."}
        confirmLabel={confirmDelete?.permanent ? "Delete Forever" : "Archive"}
        danger={confirmDelete?.permanent}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDelete?.permanent ? deleteForever : archive}
      />
    </div>
  );
}