import { useState, useEffect, useCallback, useRef } from "react";
import Draggable from "react-draggable";
import { api } from "../../lib/api";
import { X, Save, Edit3, GripHorizontal, Check, AlertCircle } from "lucide-react";

export function FloatingNoteWidget({ slug }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error
  const saveTimeoutRef = useRef(null);

  // Fetch initial note
  useEffect(() => {
    let mounted = true;
    if (slug) {
      api.getProblemNote(slug)
        .then((data) => {
          if (mounted && data?.content) {
            setNote(data.content);
          }
        })
        .catch((err) => console.error("Failed to load note:", err));
    }
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Debounced auto-save (Optimized)
  const debouncedSave = useCallback((content) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(() => {
      api.saveProblemNote(slug, content)
        .then(() => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch(() => setSaveStatus("error"));
    }, 800); // Save 800ms after typing stops
  }, [slug]);

  const handleChange = (e) => {
    const val = e.target.value;
    setNote(val);
    debouncedSave(val);
  };

  const handleManualSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus("saving");
    try {
      await api.saveProblemNote(slug, note);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("error");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-400 text-white p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center transition-all duration-300 z-50 group hover:scale-105 active:scale-95"
        title="Open Notes"
      >
        <Edit3 className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 font-medium transition-all duration-300 ease-in-out">
          Take Notes
        </span>
      </button>
    );
  }

  return (
    <Draggable handle=".drag-handle" defaultPosition={{ x: -20, y: -20 }} bounds="parent">
      <div className="absolute bottom-6 right-6 w-80 sm:w-96 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden resize-y min-h-[350px] transition-opacity duration-300">
        
        {/* Header - Drag Handle */}
        <div className="drag-handle bg-slate-800/50 border-b border-slate-700/50 p-3 flex items-center justify-between cursor-move select-none group/header hover:bg-slate-800/80 transition-colors">
          <div className="flex items-center space-x-2 text-slate-300">
            <GripHorizontal className="w-5 h-5 text-slate-500 group-hover/header:text-slate-400 transition-colors" />
            <span className="font-semibold text-sm tracking-wide">My Notes</span>
          </div>
          <div className="flex items-center space-x-2">
            
            {/* Status Indicators */}
            <div className="mr-2 flex items-center">
              {saveStatus === "saving" && (
                <div className="flex items-center gap-1.5 text-xs text-sky-400 bg-sky-500/10 px-2 py-1 rounded-full border border-sky-500/20">
                  <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  Saving
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Saved
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" /> Error
                </div>
              )}
            </div>

            <button
              onClick={handleManualSave}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md p-1.5 transition-all"
              title="Save Now"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-md p-1.5 transition-all"
              title="Close Notes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 p-0 flex flex-col h-full bg-slate-900/40">
          <textarea
            value={note}
            onChange={handleChange}
            placeholder="Jot down your thoughts, edge cases, or optimizations here. Notes auto-save as you type..."
            className="flex-1 w-full h-full min-h-[250px] bg-transparent text-slate-200 p-5 resize-none focus:outline-none focus:ring-0 text-sm font-mono leading-relaxed placeholder:text-slate-600 custom-scrollbar"
            spellCheck="false"
          />
        </div>
      </div>
    </Draggable>
  );
}
