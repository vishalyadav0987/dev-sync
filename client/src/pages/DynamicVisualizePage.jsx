import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeft } from "lucide-react";
import DynamicHtmlVisualizer from "../components/Visualization/DynamicHtmlVisualizer";
import PlayerControls from "../components/Visualization/PlayerControls";
import DynamicNotesPanel from "../components/Notes/DynamicNotesPanel";
import { Panel, Group, Separator } from "react-resizable-panels";

export default function DynamicVisualizePage() {
  const { slug } = useParams();
  const location = useLocation();
  const approachIndex = location.state?.approachIndex || 0;

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Visualization state
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showNotes, setShowNotes] = useState(false);

  // Sync state with iframe
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const iframeRef = useRef(null);

  // Load problem data
  useEffect(() => {
    api.getProblem(slug)
      .then((data) => {
        setProblem(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch problem", err);
        setLoading(false);
      });
  }, [slug]);

  // Load visualization data (only notes and bookmarks are needed for dynamic)
  useEffect(() => {
    if (!slug) return;
    async function loadVis() {
      try {
        const [notesRes, bookmarksRes] = await Promise.all([
          api.getNotes(slug).catch(() => ({ notes: [] })),
          api.getBookmarks(slug).catch(() => ({ bookmarks: [] }))
        ]);
        setNotes(notesRes.notes || []);
        setBookmarks(bookmarksRes.bookmarks || []);
      } catch (err) {
        console.error("Failed to load visualization data", err);
      }
    }
    loadVis();
  }, [slug]);

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (e) => {
      // Verify message is an object to prevent errors
      if (!e.data || typeof e.data !== 'object') return;

      if (e.data.type === 'VISUALIZATION_STATE') {
        if (typeof e.data.currentStep === 'number') setCurrentStep(e.data.currentStep);
        if (typeof e.data.totalSteps === 'number') setTotalSteps(e.data.totalSteps);
        if (typeof e.data.isPlaying === 'boolean') setIsPlaying(e.data.isPlaying);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSeek = (step) => {
    setCurrentStep(step);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SEEK', step }, '*');
    }
  };

  const handlePlayPause = () => {
    const nextPlayState = !isPlaying;
    setIsPlaying(nextPlayState);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: nextPlayState ? 'PLAY' : 'PAUSE' }, '*');
    }
  };

  // Bookmark toggle
  const toggleBookmark = async () => {
    const isBookmarked = bookmarks.some(b => b.stepId === currentStep);
    try {
      if (isBookmarked) {
        await api.removeBookmark(slug, currentStep);
        setBookmarks(prev => prev.filter(b => b.stepId !== currentStep));
      } else {
        const newBookmark = await api.addBookmark(slug, { stepId: currentStep });
        setBookmarks(prev => [...prev, newBookmark]);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-white p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
        <Link to="/dsa" className="px-6 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors text-sm font-medium">
          Back to DSA Showcase
        </Link>
      </div>
    );
  }

  // Reconstruct allApproaches exactly like DSAPage
  const isMainCodeEmpty = !problem?.cppCode || problem.cppCode.trim() === "" || problem.cppCode.trim() === "// solution" || problem.cppCode.trim() === "// alternative approach";
  const rawApproaches = problem?.approaches || [];
  const algorithmicApproaches = rawApproaches.filter(a => !a.title?.includes("Solved on"));
  
  const allApproaches = problem ? [
    ...(!isMainCodeEmpty && algorithmicApproaches.length > 0 ? [{ visualHtml: problem.visualHtml }] : []),
    ...algorithmicApproaches
  ] : [];
  
  const currentHtml = allApproaches.length > 0 
    ? (allApproaches[approachIndex]?.visualHtml || problem?.visualHtml)
    : problem?.visualHtml;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0 z-30">
        <Link
          to="/dsa"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-slate-700" />
        <h2 className="text-sm font-semibold text-white truncate">{problem.title}</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${problem.difficulty === "EASY"
              ? "text-emerald-400 bg-emerald-500/10"
              : problem.difficulty === "MEDIUM"
                ? "text-amber-400 bg-amber-500/10"
                : "text-rose-400 bg-rose-500/10"
            }`}
        >
          {problem.difficulty}
        </span>
      </div>

      {/* Visualization fills remaining space */}
      <div className="flex-1 min-h-0 relative flex">
        <Group orientation="horizontal">
          <Panel defaultSize={showNotes ? 75 : 100} minSize={30}>
            <DynamicHtmlVisualizer
              html={currentHtml}
              ref={iframeRef}
            />
          </Panel>

          {showNotes && (
            <>
              <Separator className="w-1 bg-slate-800 hover:bg-primary-500/50 transition-colors cursor-col-resize shrink-0" />
              <Panel defaultSize={25} minSize={20}>
                <DynamicNotesPanel
                  notes={notes}
                  setNotes={setNotes}
                  currentStep={currentStep}
                  problemId={slug}
                  onSeek={handleSeek}
                />
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* Player Controls at the bottom */}
      <div className="shrink-0 px-4 pb-3 pt-3">
        <PlayerControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onToggleFullscreen={() => { }}
          onToggleNotes={() => setShowNotes(!showNotes)}
          notes={notes}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
          isDynamic={true}
        />
      </div>
    </div>
  );
}
