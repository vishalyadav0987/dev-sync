import { useState } from "react";
import { X, Plus, Trash2, StickyNote as NoteIcon } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { api } from "../../lib/api";
import { NOTE_TYPES } from "../../lib/sessionHelpers";

export default function NotesDrawer({ session, onClose, onChanged }) {
  const [filter, setFilter] = useState("all");
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);

  const notes = filter === "all" ? session.notes : (session.notes || []).filter((n) => n.tags?.includes(filter));

  const addNote = async (e) => {
    e.preventDefault();
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await api.saveNote({ sessionId: session.id, content: content.trim(), tags: selectedType ? [selectedType] : [] });
      setContent("");
      setSelectedType(null);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id) => {
    await api.deleteNote(id);
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-base font-bold text-white">Session Notes</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <form onSubmit={addNote} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="Capture what you learned, a mistake, or something confusing…"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TYPES.map((t) => {
                  const active = selectedType === t.key;
                  return (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setSelectedType(active ? null : t.key)}
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        active ? t.color : "border-slate-700 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={!content.trim() || saving}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${filter === "all" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              All
            </button>
            {NOTE_TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`rounded-full px-2.5 py-1 font-semibold transition-colors ${filter === t.key ? "bg-indigo-500/20 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {notes.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-300">Nothing captured yet</p>
              <p className="mt-1 text-xs text-slate-500">Save mistakes, insights and confusing concepts while you study.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(n.tags || []).map((tag) => {
                        const meta = NOTE_TYPES.find((t) => t.key === tag);
                        if (!meta) return null;
                        return (
                          <span key={tag} className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${meta.color}`}>
                            {meta.label}
                          </span>
                        );
                      })}
                      {n.problem?.title && <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">↳ {n.problem.title}</span>}
                    </div>
                    <button onClick={() => deleteNote(n.id)} className="shrink-0 text-slate-600 hover:text-rose-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{n.content}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                    <NoteIcon className="h-3 w-3" />
                    {formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
