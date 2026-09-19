import { useState, useRef, useEffect } from "react";
import { Clock, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { api } from "../../lib/api";

function formatTimestamp(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return timeString;
  
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeString}`;
}

export default function DynamicNotesPanel({ notes, setNotes, currentStep, problemId, onSeek }) {
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef(null);

  // Focus textarea when editing
  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editingId]);

  const handleCreateNote = async () => {
    try {
      const newNote = {
        problemId,
        stepId: currentStep,
        title: `Step ${currentStep} Note`,
        content: "",
        color: "yellow",
      };
      
      const res = await api.saveNote(newNote);
      setNotes(prev => {
        if (prev.find(n => n.id === res.id)) return prev;
        return [...prev, res].sort((a, b) => {
          const stepDiff = (a.stepId ?? 0) - (b.stepId ?? 0);
          if (stepDiff !== 0) return stepDiff;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
      
      // Automatically enter edit mode for the new note
      setEditingId(res.id);
      setEditContent("");
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const handleUpdateNote = async (id) => {
    try {
      const res = await api.updateNote(id, { content: editContent });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, content: res.content } : n));
      setEditingId(null);
    } catch (err) {
      console.error("Failed to update note", err);
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this note?")) return;
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const startEditing = (note, e) => {
    e.stopPropagation();
    setEditingId(note.id);
    setEditContent(note.content || "");
  };

  return (
    <div className="h-full bg-slate-900 flex flex-col border-l border-slate-800 text-slate-300 w-full overflow-hidden shrink-0">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
        <h3 className="font-bold flex items-center gap-2">
          <Clock size={16} className="text-primary-400" />
          Notes
          <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-normal ml-2">
            {notes.length}
          </span>
        </h3>
        <button
          onClick={handleCreateNote}
          className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium border border-transparent hover:border-slate-700"
          title="Add note at current step"
        >
          <Plus size={14} /> Add Note
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8 px-4">
            No notes yet. Create a note to bookmark a step in the visualization.
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Connecting line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-slate-800" />

            {notes.map((note) => {
              const isActive = note.stepId === currentStep;
              const isEditing = editingId === note.id;
              
              return (
                <div 
                  key={note.id} 
                  className={`flex gap-3 relative cursor-pointer group ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                  onClick={() => !isEditing && note.stepId !== null && onSeek(note.stepId)}
                >
                  {/* Step Marker */}
                  <div className="flex flex-col items-center mt-1 z-10 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      isActive 
                        ? 'bg-primary-600 border-primary-500 text-white shadow-[0_0_10px_rgba(var(--color-primary-500),0.3)]' 
                        : 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-slate-500 group-hover:text-slate-300'
                    }`}>
                      {note.stepId !== null ? note.stepId : "-"}
                    </div>
                  </div>
                  
                  {/* Note Card */}
                  <div className={`flex-1 p-3 rounded-lg shadow-sm border transition-colors ${
                    isActive 
                      ? 'bg-slate-800/80 border-primary-500/50' 
                      : 'bg-slate-800/50 border-slate-700/50 group-hover:border-slate-600'
                  }`}>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-300">
                          Step {note.stepId !== null ? note.stepId : "General"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatTimestamp(note.createdAt)}
                        </span>
                      </div>
                      
                      {!isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => startEditing(note, e)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 hover:bg-rose-900/50 rounded text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing ? (
                      <div className="flex flex-col gap-2 mt-2" onClick={e => e.stopPropagation()}>
                        <textarea
                          ref={textareaRef}
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-primary-500 min-h-[80px] resize-y"
                          placeholder="Type your note here..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <Check size={14} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {note.content || <span className="text-slate-500 italic">Empty note</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
