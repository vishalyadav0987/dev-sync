import { useState, useEffect, useRef } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import VisualizationIframe from "./VisualizationIframe";
import PlayerControls from "./PlayerControls";
import NotesWorkspace from "../Notes/NotesWorkspace";
import NotesTimeline from "../Notes/NotesTimeline";
import { api } from "../../lib/api";

export default function VisualizationWorkspace({ problemId, codeComponent }) {
  const [visData, setVisData] = useState(null);
  const [history, setHistory] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [layoutMode, setLayoutMode] = useState("vis-code"); // 'vis', 'vis-code', 'vis-notes', 'triple'
  const [totalSteps, setTotalSteps] = useState(0);
  const workspaceRef = useRef(null);

  // Playback is now handled by the iframe. 
  // We just pass isPlaying to VisualizationIframe, which sends PLAY/PAUSE messages.
  // The iframe will send STEP_CHANGED messages which updates currentStep.

  // Load data
  useEffect(() => {
    async function load() {
      try {
        const [visRes, histRes, notesRes, bookmarksRes] = await Promise.all([
          api.getVisualization(problemId),
          api.getVisualizationHistory(problemId).catch(() => null),
          api.getNotes(problemId).catch(() => ({ notes: [] })),
          api.getBookmarks(problemId).catch(() => ({ bookmarks: [] }))
        ]);
        
        setVisData(visRes);
        setHistory(histRes);
        setNotes(notesRes.notes || []);
        setBookmarks(bookmarksRes.bookmarks || []);
        
        if (histRes?.lastStep > 0) {
          setShowContinuePrompt(true);
        } else {
          setCurrentStep(0);
        }
      } catch (err) {
        console.error("Failed to load visualization data", err);
      }
    }
    load();
  }, [problemId]);

  // Save progress when user leaves or pauses for a while
  useEffect(() => {
    if (!visData || currentStep === history?.lastStep || totalSteps === 0) return;
    
    const timeout = setTimeout(() => {
      api.saveVisualizationHistory(problemId, {
        lastStep: currentStep,
        totalSteps: totalSteps
      }).catch(console.error);
    }, 2000); // Save after 2s of being on the same step

    return () => clearTimeout(timeout);
  }, [currentStep, problemId, visData, history, totalSteps]);

  // Handle Fullscreen and Bookmarks
  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
      if (e.key.toLowerCase() === 'b' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        toggleBookmark();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentStep, bookmarks]);

  const toggleBookmark = async () => {
    const isBookmarked = bookmarks.some(b => b.stepId === currentStep);
    try {
      if (isBookmarked) {
        await api.removeBookmark(problemId, currentStep);
        setBookmarks(prev => prev.filter(b => b.stepId !== currentStep));
      } else {
        const newBookmark = await api.addBookmark(problemId, { stepId: currentStep });
        setBookmarks(prev => [...prev, newBookmark]);
      }
    } catch (err) {
      console.error("Failed to toggle bookmark", err);
    }
  };

  if (!visData) {
    return <div className="h-[600px] bg-slate-900/50 rounded-xl animate-pulse" />;
  }

  // Derived layouts based on state
  const showCode = layoutMode === "vis-code" || layoutMode === "triple";
  const showTimeline = layoutMode === "vis-notes" || layoutMode === "triple" || showNotes;

  return (
    <div 
      ref={workspaceRef}
      className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950 p-4" : "h-full mt-2"}`}
    >
      <div className="flex-1 min-h-0 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 flex relative">
        
        {/* CONTINUE PROMPT OVERLAY */}
        {showContinuePrompt && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-2xl max-w-sm text-center">
              <h3 className="text-xl font-bold text-white mb-2">Resume Session?</h3>
              <p className="text-slate-400 text-sm mb-6">
                You previously left off at Step {history?.lastStep}. Do you want to continue from there?
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => {
                    setCurrentStep(0);
                    setShowContinuePrompt(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Start Over
                </button>
                <button 
                  onClick={() => {
                    setCurrentStep(history?.lastStep);
                    setShowContinuePrompt(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-500 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        <Group orientation="horizontal">
          {/* VISUALIZATION PANEL */}
          <Panel defaultSize={showCode ? 50 : 100} minSize={30}>
            <div className="w-full h-full p-2">
              <VisualizationIframe 
                html={visData.html} 
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
            </div>
          </Panel>

          {showCode && (
            <>
              <Separator className="w-1 bg-slate-800 hover:bg-primary-500/50 transition-colors cursor-col-resize" />
              <Panel defaultSize={showNotes ? 30 : 50} minSize={20}>
                <div className="w-full h-full bg-slate-900 overflow-auto">
                  {codeComponent}
                </div>
              </Panel>
            </>
          )}

          {showTimeline && (
            <>
              <Separator className="w-1 bg-slate-800 hover:bg-primary-500/50 transition-colors cursor-col-resize" />
              <Panel defaultSize={20} minSize={15}>
                <NotesTimeline notes={notes} currentStep={currentStep} />
              </Panel>
            </>
          )}
        </Group>

        {/* FLOATING NOTES LAYER */}
        <NotesWorkspace 
          notes={notes} 
          setNotes={setNotes} 
          currentStep={currentStep} 
          problemId={problemId} 
          workspaceRef={workspaceRef}
        />
        
      </div>

      <PlayerControls 
        currentStep={currentStep}
        totalSteps={totalSteps || visData.metadata.totalSteps}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onSeek={setCurrentStep}
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        onToggleNotes={() => setShowNotes(!showNotes)}
        notes={notes}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
      />
    </div>
  );
}
