import { Play, Pause, SkipBack, SkipForward, Maximize, FileText, Bookmark } from "lucide-react";

export default function PlayerControls({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayPause,
  onSeek,
  onToggleFullscreen,
  onToggleNotes,
  notes = [],
  bookmarks = [],
  onToggleBookmark
}) {
  const progress = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;
  const isBookmarked = bookmarks.some(b => b.stepId === currentStep);

  return (
    <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-lg mt-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSeek(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <SkipBack size={18} />
        </button>

        <button
          onClick={onPlayPause}
          className="w-10 h-10 flex items-center justify-center bg-primary-600 hover:bg-primary-500 rounded-full text-white shadow-lg shadow-primary-500/20 transition-all active:scale-95"
        >
          {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
        </button>

        <button
          onClick={() => onSeek(Math.min(totalSteps - 1, currentStep + 1))}
          disabled={currentStep >= totalSteps - 1}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center min-w-[100px]">
        <span className="text-sm font-medium font-mono">
          {currentStep + 1} <span className="text-slate-500">/</span> {totalSteps}
        </span>
      </div>

      <div className="flex-1 relative flex items-center h-8 group mx-4">
        <div className="absolute w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Render note indicators on the timeline */}
        {notes.map(note => {
          if (note.stepId === null || note.stepId === undefined) return null;
          const pos = (note.stepId / (totalSteps - 1)) * 100;
          return (
            <div
              key={`note-${note.id}`}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)] cursor-pointer hover:scale-150 transition-transform -translate-y-1/2 top-1/2"
              style={{ left: `calc(${pos}% - 6px)` }}
              title={note.title || "Note"}
              onClick={() => onSeek(note.stepId)}
            />
          );
        })}
        {/* Render bookmark indicators */}
        {bookmarks.map(bookmark => {
          const pos = (bookmark.stepId / (totalSteps - 1)) * 100;
          return (
            <div
              key={`bookmark-${bookmark.stepId}`}
              className="absolute w-2 h-4 bg-primary-500 rounded shadow cursor-pointer hover:scale-150 transition-transform -translate-y-1/2 top-1/2"
              style={{ left: `calc(${pos}% - 4px)` }}
              title="Bookmarked Step"
              onClick={() => onSeek(bookmark.stepId)}
            />
          );
        })}

        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleBookmark}
          className={`p-2 rounded-lg transition-colors ${isBookmarked ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          title="Bookmark Step"
        >
          <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
        </button>
        <button
          onClick={onToggleNotes}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors relative"
          title="Toggle Notes"
        >
          <FileText size={18} />
          {notes.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full" />
          )}
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Focus Mode"
        >
          <Maximize size={18} />
        </button>
      </div>
    </div>
  );
}
