import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { ArrowLeft, Plus } from "lucide-react";
import NQueensVisualizer from "../components/Visualization/NQueensVisualizer";
import PlayerControls from "../components/Visualization/PlayerControls";
import NotesWorkspace from "../components/Notes/NotesWorkspace";

export default function VisualizePage() {
  const { slug } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Visualization state
  const [visData, setVisData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showNotes, setShowNotes] = useState(true);
  const workspaceRef = useRef(null);

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

  // Load visualization data
  useEffect(() => {
    if (!slug) return;
    async function loadVis() {
      try {
        const [visRes, notesRes, bookmarksRes] = await Promise.all([
          api.getVisualization(slug),
          api.getNotes(slug).catch(() => ({ notes: [] })),
          api.getBookmarks(slug).catch(() => ({ bookmarks: [] }))
        ]);
        setVisData(visRes);
        setNotes(notesRes.notes || []);
        setBookmarks(bookmarksRes.bookmarks || []);
      } catch (err) {
        console.error("Failed to load visualization data", err);
      }
    }
    loadVis();
  }, [slug]);

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

  // Create a new sticky note
  const createNote = async () => {
    try {
      const newNote = {
        problemId: slug,
        stepId: currentStep,
        title: "",
        content: "",
        color: "yellow",
        positionX: 100 + Math.random() * 200,
        positionY: 80 + Math.random() * 150,
        width: 250,
        height: 200,
        isPinned: false
      };
      const res = await api.saveNote(newNote);
      setNotes(prev => {
        if (prev.find(n => n.id === res.id)) return prev;
        return [...prev, res];
      });
    } catch (err) {
      console.error("Failed to create note", err);
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

  return (
    <div ref={workspaceRef} className="flex-1 flex flex-col bg-slate-950 text-white overflow-hidden">
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
      <div className="flex-1 min-h-0 relative">
        <NQueensVisualizer
          currentStep={currentStep}
          onStepChange={(step) => {
            setCurrentStep(step);
            if (totalSteps > 0 && step >= totalSteps - 1) {
              setIsPlaying(false);
            }
          }}
          onReady={(steps) => setTotalSteps(steps)}
          isPlaying={isPlaying}
        />

        {/* Floating Notes Layer - overlays the visualization */}
        {showNotes && (
          <NotesWorkspace
            notes={notes}
            setNotes={setNotes}
            currentStep={currentStep}
            problemId={slug}
            workspaceRef={workspaceRef}
          />
        )}
      </div>

      {/* Player Controls at the bottom */}
      <div className="shrink-0 px-4 pb-3">
        <PlayerControls
          currentStep={currentStep}
          totalSteps={totalSteps || visData?.metadata?.totalSteps || 100}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onSeek={setCurrentStep}
          onToggleFullscreen={() => { }}
          onToggleNotes={() => setShowNotes(!showNotes)}
          notes={notes}
          bookmarks={bookmarks}
          onToggleBookmark={toggleBookmark}
        />
      </div>
    </div>
  );
}
