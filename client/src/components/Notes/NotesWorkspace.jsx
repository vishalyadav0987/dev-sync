import { useEffect } from "react";
import { Plus } from "lucide-react";
import StickyNote from "./StickyNote";
import { api, socket } from "../../lib/api";

export default function NotesWorkspace({ notes, setNotes, currentStep, problemId, workspaceRef }) {
  
  const createNote = async () => {
    try {
      const newNote = {
        problemId,
        stepId: currentStep,
        title: "",
        content: "",
        color: "yellow",
        positionX: window.innerWidth / 2 - 125,
        positionY: window.innerHeight / 2 - 100,
        width: 250,
        height: 200,
        isPinned: false
      };
      
      const res = await api.saveNote(newNote);
      // Let the socket event handle the state update to avoid duplicates, 
      // but optimistic update is fine too since we check IDs.
      setNotes(prev => {
        if (prev.find(n => n.id === res.id)) return prev;
        return [...prev, res];
      });
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  // Keyboard shortcut 'N' for new note
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        createNote();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, problemId]);

  // Socket.io sync
  useEffect(() => {
    const onNoteUpdated = ({ action, note, id }) => {
      setNotes(prev => {
        if (action === "deleted") {
          return prev.filter(n => n.id !== id);
        }
        if (action === "created") {
          if (prev.find(n => n.id === note.id)) return prev;
          return [...prev, note];
        }
        if (action === "updated") {
          return prev.map(n => n.id === note.id ? { ...n, ...note } : n);
        }
        return prev;
      });
    };

    socket.on("note:updated", onNoteUpdated);
    return () => socket.off("note:updated", onNoteUpdated);
  }, [setNotes]);

  const updateNoteLocally = (id, updates) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = async (id) => {
    try {
      await api.deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      
      {/* Create Note Floating Button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={createNote}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-bold px-4 py-2 rounded-full shadow-lg transition-transform active:scale-95"
        >
          <Plus size={18} /> Note
        </button>
      </div>

      {/* Render Notes */}
      {notes.map(note => {
        // Only show pinned notes or notes attached to the current step (or general notes attached to null)
        const isVisible = note.isPinned || note.stepId === currentStep || note.stepId === null || note.stepId === undefined;
        
        if (!isVisible) return null;

        return (
          <StickyNote 
            key={note.id}
            note={note}
            updateNoteLocally={updateNoteLocally}
            deleteNote={() => deleteNote(note.id)}
            workspaceRef={workspaceRef}
          />
        );
      })}
    </div>
  );
}
