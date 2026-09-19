import { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import { Trash2, Pin, Hash } from "lucide-react";
import { api } from "../../lib/api";

const COLORS = {
  yellow: "bg-yellow-200 border-yellow-300 text-yellow-950 placeholder-yellow-800/50",
  blue: "bg-blue-200 border-blue-300 text-blue-950 placeholder-blue-800/50",
  green: "bg-green-200 border-green-300 text-green-950 placeholder-green-800/50",
  purple: "bg-purple-200 border-purple-300 text-purple-950 placeholder-purple-800/50",
  pink: "bg-pink-200 border-pink-300 text-pink-950 placeholder-pink-800/50",
  orange: "bg-orange-200 border-orange-300 text-orange-950 placeholder-orange-800/50"
};

export default function StickyNote({ note, updateNoteLocally, deleteNote, workspaceRef }) {
  const [isHovered, setIsHovered] = useState(false);
  const saveTimeoutRef = useRef(null);
  const nodeRef = useRef(null);

  // Debounced save
  const scheduleSave = (updates) => {
    updateNoteLocally(note.id, updates);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      api.updateNote(note.id, updates).catch(console.error);
    }, 1000);
  };

  const handleDragStop = (e, data) => {
    scheduleSave({ positionX: data.x, positionY: data.y });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".drag-handle"
      defaultPosition={{ x: note.positionX, y: note.positionY }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div 
        ref={nodeRef}
        className={`absolute pointer-events-auto w-[250px] rounded-lg shadow-xl border flex flex-col overflow-hidden transition-shadow ${isHovered ? "shadow-2xl z-30" : "z-20"} ${COLORS[note.color]}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: note.width || 250, height: note.height || 200 }}
      >
        {/* Header / Drag Handle */}
        <div className="drag-handle h-8 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing bg-black/5 hover:bg-black/10 transition-colors">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => scheduleSave({ isPinned: !note.isPinned })}
              className={`p-1 rounded hover:bg-black/10 transition-colors ${note.isPinned ? "text-black" : "text-black/40 opacity-0 group-hover:opacity-100"}`}
              style={{ opacity: (isHovered || note.isPinned) ? 1 : 0 }}
            >
              <Pin size={14} className={note.isPinned ? "fill-current" : ""} />
            </button>
            {note.stepId !== null && (
              <span className="text-[10px] font-mono font-bold bg-black/10 px-1.5 py-0.5 rounded">
                Step {note.stepId}
              </span>
            )}
          </div>
          
          <div 
            className="flex items-center gap-1 transition-opacity" 
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            {Object.keys(COLORS).map(c => (
              <button 
                key={c}
                onClick={() => scheduleSave({ color: c })}
                className={`w-3 h-3 rounded-full border border-black/20 ${COLORS[c].split(' ')[0]} ${note.color === c ? 'ring-1 ring-black/50' : ''}`}
              />
            ))}
            <button 
              onClick={() => {
                if (window.confirm("Delete this note?")) {
                  deleteNote();
                }
              }}
              className="p-1 hover:bg-black/10 rounded text-black/60 hover:text-black ml-1 transition-colors"
              title="Delete Note"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col p-3 gap-2">
          <input
            type="text"
            placeholder="Title..."
            value={note.title || ""}
            onChange={(e) => scheduleSave({ title: e.target.value })}
            className="bg-transparent border-none outline-none font-bold text-sm"
          />
          <textarea
            placeholder="Write a note..."
            value={note.content || ""}
            onChange={(e) => scheduleSave({ content: e.target.value })}
            className="bg-transparent border-none outline-none resize-none flex-1 text-sm leading-relaxed"
          />
        </div>
      </div>
    </Draggable>
  );
}
