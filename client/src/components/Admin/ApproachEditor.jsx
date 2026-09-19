import { useState } from "react";
import Editor from "@monaco-editor/react";
import { ChevronDown, ChevronUp, Trash2, GripVertical } from "lucide-react";

/**
 * Editor for a single "alternative approach" on a Problem — its own C++ code,
 * complexities, notes, and (crucially) its own visualHtml, so a single problem
 * can carry several independently-selectable visualizations.
 *
 * Collapsed by default: Monaco is only mounted while expanded so having many
 * approaches on one problem doesn't spin up a dozen editor instances at once.
 */
export default function ApproachEditor({ approach, index, total, onChange, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(index === 0);

  const set = (key) => (e) => onChange({ ...approach, [key]: e.target.value });
  const setCode = (key) => (value) => onChange({ ...approach, [key]: value ?? "" });

  return (
    <div className="rounded-md border border-slate-700 bg-slate-900/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800">
        <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
        <input
          placeholder={`Approach ${index + 1} title (e.g. "Brute Force", "Optimized DP")`}
          value={approach.title}
          onChange={set("title")}
          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ▲
          </button>
          <button
            type="button"
            title="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Remove approach"
            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          <div className="overflow-hidden rounded-md border border-slate-700">
            <div className="bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-700">
              C++ Code (this approach)
            </div>
            <Editor
              height="180px"
              defaultLanguage="cpp"
              theme="vs-dark"
              value={approach.cppCode}
              onChange={setCode("cppCode")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Time complexity e.g. O(n)"
              value={approach.timeComplexity || ""}
              onChange={set("timeComplexity")}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <input
              placeholder="Space complexity e.g. O(1)"
              value={approach.spaceComplexity || ""}
              onChange={set("spaceComplexity")}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>

          <textarea
            placeholder="Notes for this approach"
            value={approach.approachNotes || ""}
            onChange={set("approachNotes")}
            rows={2}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />

          <div className="overflow-hidden rounded-md border border-slate-700">
            <div className="bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-700">
              Visual HTML/SVG (this approach's own visualization)
            </div>
            <Editor
              height="180px"
              defaultLanguage="html"
              theme="vs-dark"
              value={approach.visualHtml || ""}
              onChange={setCode("visualHtml")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
