import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Plus, Trash2, Edit } from "lucide-react";
import ApproachEditor from "../components/Admin/ApproachEditor";

let _approachSeq = 0;
const blankApproach = () => ({
  _key: `new-${++_approachSeq}`, // client-only key for React list identity; stripped before sending
  title: "",
  cppCode: "// alternative approach\n",
  timeComplexity: "",
  spaceComplexity: "",
  approachNotes: "",
  visualHtml: "",
});

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Unlinked "author mode" route (/author-console) for daily content entry.
 * Gated by a bearer token (ADMIN_TOKEN on the server) entered once and kept
 * only in component state — never persisted, never sent except as a header.
 */
export default function AdminPage() {
  const [token, setToken] = useState("");
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    statement: "",
    difficulty: "MEDIUM",
    tags: "",
    cppCode: "// solution\n",
    timeComplexity: "",
    spaceComplexity: "",
    edgeCases: "",
    approachNotes: "",
    visualHtml: "",
    categoryId: "",
    categoryName: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loadSlug, setLoadSlug] = useState("");
  const [status, setStatus] = useState(null);
  // Alternative approaches: each carries its OWN cppCode + visualHtml, so a
  // single problem can expose multiple selectable code/visualization pairs.
  const [approaches, setApproaches] = useState([]);
  const [problemsList, setProblemsList] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, categoryId: f.categoryId || data[0].id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("saving...");
    try {
      const url = editingId ? `${BASE_URL}/admin/problems/${editingId}` : `${BASE_URL}/admin/problems`;
      const method = editingId ? "PATCH" : "POST";
      // Basic guard: every approach needs a title before it's worth sending.
      const cleanApproaches = approaches
        .filter((a) => a.title.trim() || a.cppCode.trim() || a.visualHtml.trim())
        .map(({ _key, ...rest }) => rest); // strip client-only React key

      // Prepare payload
      const payload = {
        ...form,
        tags: typeof form.tags === "string" ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : form.tags,
        edgeCases: typeof form.edgeCases === "string" ? form.edgeCases.split("\n").map((t) => t.trim()).filter(Boolean) : form.edgeCases,
        approaches: cleanApproaches,
      };

      if (payload.categoryId === "NEW") {
        delete payload.categoryId;
        if (!payload.categoryName?.trim()) {
          setStatus("error: Please enter a new category name");
          return;
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = typeof errorData.error === 'object' 
          ? JSON.stringify(errorData.error, null, 2)
          : errorData.error;
        throw new Error(errorMessage || "Failed to save");
      }
      const saved = await res.json();
      const successMsg = editingId ? "Problem updated successfully!" : "Problem saved successfully!";
      setStatus(successMsg);
      alert(successMsg);
      setTimeout(() => setStatus(null), 3000);
      
      if (!editingId) {
        // Reset if it was a new creation
        setForm({ ...form, title: "", statement: "", tags: "", cppCode: "", visualHtml: "", categoryName: "" });
        setApproaches([]);
      } else {
        // Re-sync approach ids (server may have created new ones) so further
        // edits update in place instead of re-creating duplicates.
        setApproaches(
          (saved.approaches || []).map((a) => ({ ...a, _key: a.id }))
        );
      }
      if (problemsList.length > 0) {
        loadAllProblems();
      }
    } catch (err) {
      setStatus(`error: ${err.message}`);
    }
  };

  const loadProblem = async (slugToLoad) => {
    const slug = typeof slugToLoad === "string" ? slugToLoad : loadSlug;
    if (!slug) return;
    setStatus("loading...");
    try {
      const res = await fetch(`${BASE_URL}/admin/problems/${slug}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Problem not found");
      }
      const data = await res.json();
      setEditingId(data.id);
      setLoadSlug(slug);
      setForm({
        title: data.title || "",
        statement: data.statement || "",
        difficulty: data.difficulty || "MEDIUM",
        tags: (data.tags || []).join(", "),
        cppCode: data.cppCode || "",
        timeComplexity: data.timeComplexity || "",
        spaceComplexity: data.spaceComplexity || "",
        edgeCases: (data.edgeCases || []).join("\n"),
        approachNotes: data.approachNotes || "",
        visualHtml: data.visualHtml || "",
        categoryId: data.categoryId || "",
        categoryName: "",
      });
      setApproaches((data.approaches || []).map((a) => ({ ...a, _key: a.id })));
      setStatus("Loaded problem for editing.");
    } catch (err) {
      setStatus(`error loading: ${err.message}`);
    }
  };

  const loadAllProblems = async () => {
    if (!token) {
      setStatus("Token required to load all problems");
      return;
    }
    setStatus("Loading all problems...");
    try {
      const res = await fetch(`${BASE_URL}/admin/problems`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProblemsList(data);
        setStatus("Problems loaded.");
      } else {
        const err = await res.json();
        setStatus(`Error: ${err.error || "Failed to load problems"}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const deleteProblem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) return;
    setStatus("Deleting...");
    try {
      const res = await fetch(`${BASE_URL}/admin/problems/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatus("Problem deleted.");
        alert("Problem deleted successfully!");
        setTimeout(() => setStatus(null), 3000);
        loadAllProblems();
        if (editingId === id) {
          setEditingId(null);
          setLoadSlug("");
          setForm({ ...form, title: "", statement: "", tags: "", cppCode: "", visualHtml: "" });
          setApproaches([]);
        }
      } else {
        const err = await res.json();
        setStatus(`Error: ${err.error || "Failed to delete"}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-4 text-xl font-bold text-white">Daily Content Entry & Updater</h1>
      <div className="mb-6 rounded-md bg-slate-900 p-4 border border-slate-800">
        <input
          type="password"
          placeholder="Admin token (required for save/update)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="mb-4 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Load by Slug (e.g. n-queens)"
            value={loadSlug}
            onChange={(e) => setLoadSlug(e.target.value)}
            className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="button" onClick={loadProblem} className="rounded-md bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-colors">
            Load Data
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setApproaches([]); setStatus("Switched to Create New Mode"); }} className="rounded-md bg-red-900/50 text-red-300 hover:bg-red-800/60 px-4 py-2 text-sm font-semibold transition-colors border border-red-800/50">
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Title" value={form.title} onChange={update("title")} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        
        <div className="flex gap-2">
          <select value={form.categoryId} onChange={update("categoryId")} className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            <option value="" disabled>Select a Category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="NEW">-- Create New Category --</option>
          </select>
          {form.categoryId === "NEW" && (
            <input 
              placeholder="New Category Name" 
              value={form.categoryName || ""} 
              onChange={update("categoryName")} 
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" 
            />
          )}
        </div>

        <textarea placeholder="Problem statement" value={form.statement} onChange={update("statement")} rows={3} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />

        <div className="grid grid-cols-2 gap-3">
          <select value={form.difficulty} onChange={update("difficulty")} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
            <option>EASY</option><option>MEDIUM</option><option>HARD</option>
          </select>
          <input placeholder="tags, comma, separated" value={form.tags} onChange={update("tags")} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </div>

        <div className="overflow-hidden rounded-md border border-slate-700">
          <Editor height="240px" defaultLanguage="cpp" theme="vs-dark" value={form.cppCode}
            onChange={(v) => setForm((f) => ({ ...f, cppCode: v ?? "" }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Time complexity e.g. O(n)" value={form.timeComplexity} onChange={update("timeComplexity")} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <input placeholder="Space complexity e.g. O(1)" value={form.spaceComplexity} onChange={update("spaceComplexity")} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        </div>

        <textarea placeholder="Edge cases (one per line)" value={form.edgeCases} onChange={update("edgeCases")} rows={3} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        <textarea placeholder="Approach notes" value={form.approachNotes} onChange={update("approachNotes")} rows={3} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
        <div className="overflow-hidden rounded-md border border-slate-700">
          <div className="bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-700">
            Visual HTML/SVG (optional)
          </div>
          <Editor height="240px" defaultLanguage="html" theme="vs-dark" value={form.visualHtml}
            onChange={(v) => setForm((f) => ({ ...f, visualHtml: v ?? "" }))} />
        </div>

        {/* Alternative Approaches: each has its own code + its own visualHtml,
            so one problem can serve multiple selectable code/visualization pairs. */}
        <div className="rounded-md border border-slate-800 bg-slate-900/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Alternative Approaches</h3>
              <p className="text-xs text-slate-500">
                Optional. Add extra approaches (e.g. Brute Force vs Optimized) — each gets its own code
                and its own visualization, selectable as tabs on the problem page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setApproaches((prev) => [...prev, blankApproach()])}
              className="flex items-center gap-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Approach
            </button>
          </div>

          {approaches.length > 0 && (
            <div className="space-y-2">
              {approaches.map((appr, idx) => (
                <ApproachEditor
                  key={appr._key}
                  approach={appr}
                  index={idx}
                  total={approaches.length}
                  onChange={(next) =>
                    setApproaches((prev) => prev.map((a, i) => (i === idx ? next : a)))
                  }
                  onRemove={() => setApproaches((prev) => prev.filter((_, i) => i !== idx))}
                  onMove={(dir) =>
                    setApproaches((prev) => {
                      const next = [...prev];
                      const target = idx + dir;
                      if (target < 0 || target >= next.length) return prev;
                      [next[idx], next[target]] = [next[target], next[idx]];
                      return next;
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button className={`rounded-md px-6 py-2 text-sm font-bold text-white transition-colors ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
            {editingId ? "Update Problem" : "Save New Problem"}
          </button>
          {status && <span className="text-sm font-medium text-slate-300 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">{status}</span>}
        </div>
      </form>

      <div className="mt-12 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Uploaded Problems</h2>
          <button type="button" onClick={loadAllProblems} className="rounded-md bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-colors">
            Fetch All Problems
          </button>
        </div>
        
        {problemsList.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-slate-700 bg-slate-900">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {problemsList.map((p) => (
                  <tr key={p.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">{p.title}</td>
                    <td className="px-4 py-3">{p.category?.name || "N/A"}</td>
                    <td className="px-4 py-3">{p.difficulty}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            loadProblem(p.slug);
                          }}
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProblem(p.id)}
                          className="p-1.5 rounded bg-red-900/40 text-red-400 hover:text-red-300 hover:bg-red-900/60 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No problems loaded. Enter token and click Fetch All Problems.</p>
        )}
      </div>
    </div>
  );
}
