import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, ExternalLink, Plus, Layers, Eye, Sparkles } from "lucide-react";
import FolderTree from "../components/DSA/FolderTree";
import CodeAnalyzer from "../components/DSA/CodeAnalyzer";
import { FloatingNoteWidget } from "../components/DSA/FloatingNoteWidget";
import { api, socket } from "../lib/api";

function CodeViewer({ code, slug }) {
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  const handleCopy = () => {
    navigator.clipboard.writeText(code || "");
    setCopied(true);
    setCopyCount(c => c + 1);
    api.trackCopy(slug).catch(console.error);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col mt-6">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-300">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-sm">C++ Solution</h3>
        </div>

        <div className="flex gap-3">
          {copyCount > 0 && (
            <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded flex items-center border border-slate-700/50">
              Copied {copyCount} time{copyCount !== 1 ? 's' : ''}
            </span>
          )}

          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors border border-slate-700">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Code"}
          </button>

          <Link
            to={`/dsa/${slug}/visualize`}
            onClick={() => api.trackViz(slug).catch(console.error)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-lg shadow-indigo-500/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Visualizer
          </Link>
        </div>
      </div>
      <div className="p-5 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed bg-[#0d1117] min-h-[300px]">
        <pre><code>{code || "Code not available for this problem yet."}</code></pre>
      </div>
    </div>
  );
}

export default function DSAPage({ categories: initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [activeProblem, setActiveProblem] = useState(null);
  const [activeApproachIndex, setActiveApproachIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ copyCount: 0, vizViewCount: 0 });

  // Sync initial stats when active problem changes
  useEffect(() => {
    if (activeProblem) {
      setStats({
        copyCount: activeProblem.copyCount || 0,
        vizViewCount: activeProblem.vizViewCount || 0
      });
    }
  }, [activeProblem]);

  // Listen to socket for real-time updates
  useEffect(() => {
    const handleStatsUpdate = (data) => {
      if (activeProblem && data.slug === activeProblem.slug) {
        setStats({
          copyCount: data.copyCount,
          vizViewCount: data.vizViewCount
        });
      }
    };

    socket.on("problem-stats-updated", handleStatsUpdate);
    return () => socket.off("problem-stats-updated", handleStatsUpdate);
  }, [activeProblem]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, probs] = await Promise.all([
          api.getCategories(),
          api.getProblems()
        ]);

        // Transform problems into tree nodes
        const problemNodes = probs.map(p => ({
          ...p,
          name: p.title,
          parentId: p.categoryId,
          isProblem: true
        }));

        setCategories([...cats, ...problemNodes]);
      } catch (e) {
        console.error("Failed to load DSA data:", e);
      }
    }

    if (categories.length === 0) {
      loadData();
    }
  }, [categories.length]);

  // Auto-select last viewed problem from localStorage
  useEffect(() => {
    if (categories.length > 0 && !activeProblem && !loading) {
      const lastSlug = localStorage.getItem("dsa-last-problem");
      if (lastSlug) {
        const node = categories.find(c => c.isProblem && c.slug === lastSlug);
        if (node) {
          handleSelectProblem(node);
        }
      }
    }
  }, [categories]);

  const handleSelectProblem = async (node) => {
    // Only select actual problems
    if (node.isProblem) {
      localStorage.setItem("dsa-last-problem", node.slug);
      setLoading(true);
      try {
        const full = await api.getProblem(node.slug);
        setActiveProblem(full);
        setActiveApproachIndex(0);
      } catch (e) {
        console.error("Failed to fetch full problem:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddToSession = async () => {
    if (!activeProblem) return;
    try {
      // Find an active session or create a new one
      const sessions = await api.getSessions("ACTIVE");
      let sessionId;
      if (sessions.length > 0) {
        sessionId = sessions[0].id;
      } else {
        const newSession = await api.createSession({ title: "My Study Session" });
        sessionId = newSession.id;
      }
      // Add problem to session
      await api.addSessionProblems(sessionId, [activeProblem.id]);
      alert(`Added ${activeProblem.title || activeProblem.name} to your session!`);
    } catch (e) {
      console.error("Failed to add to session:", e);
      alert("Failed to add to session.");
    }
  };

  // Check if the main problem code is just the default empty placeholder or empty
  const isMainCodeEmpty = !activeProblem?.cppCode || activeProblem.cppCode.trim() === "" || activeProblem.cppCode.trim() === "// solution" || activeProblem.cppCode.trim() === "// alternative approach";

  const rawApproaches = activeProblem?.approaches || [];
  const algorithmicApproaches = rawApproaches.filter(a => !a.title?.includes("Solved on"));
  const historicalSolutions = rawApproaches.filter(a => a.title?.includes("Solved on")).sort((a, b) => b.id - a.id); // Sort newest first if possible, or leave as is

  const allApproaches = activeProblem ? [
    // Only include the main approach if it actually contains code, so we don't show an empty "Approach 1"
    ...(!isMainCodeEmpty && algorithmicApproaches.length > 0 ? [{
      id: "main",
      title: "Main Solution",
      cppCode: activeProblem.cppCode,
      timeComplexity: activeProblem.timeComplexity,
      spaceComplexity: activeProblem.spaceComplexity,
      approachNotes: activeProblem.approachNotes,
      visualHtml: activeProblem.visualHtml
    }] : []),
    // If there are no alternative approaches, we just use the main one implicitly below.
    ...algorithmicApproaches
  ] : [];

  const hasApproaches = allApproaches.length > 1 || algorithmicApproaches.length > 0;
  const currentApproach = allApproaches.length > 0 ? (allApproaches[activeApproachIndex] || allApproaches[0]) : null;

  const displayCode = currentApproach ? currentApproach.cppCode : (activeProblem?.cppCode || "");
  const displayTime = currentApproach ? currentApproach.timeComplexity : (activeProblem?.timeComplexity || "O(N)");
  const displaySpace = currentApproach ? currentApproach.spaceComplexity : (activeProblem?.spaceComplexity || "O(N)");
  const displayNotes = currentApproach ? currentApproach.approachNotes : activeProblem?.approachNotes;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#030712] text-slate-200 selection:bg-indigo-500/30">

      {/* PREMIUM LEFT SIDEBAR: Floating glassmorphism effect with ambient glow */}
      <aside className="w-80 flex-shrink-0 bg-slate-900/40 border-r border-slate-800/60 backdrop-blur-2xl overflow-hidden hidden md:flex flex-col relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all">
        <div className="absolute top-0 left-0 right-0 h-40 bg-indigo-500/10 blur-[60px] rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="p-6 pb-4 shrink-0 relative z-10 border-b border-white/5">
          <h1 className="text-2xl font-black bg-gradient-to-br from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent tracking-tight">
            DSA Showcase
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Problem Explorer</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
          <FolderTree
            categories={categories}
            activeSlug={activeProblem?.slug}
            onSelect={handleSelectProblem}
          />
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT: Smooth scrolling, ambient backgrounds, and slick transitions */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative scroll-smooth bg-gradient-to-br from-[#030712] to-[#0a0f1c]">
        {/* Ambient background glow for the main page */}
        <div className="fixed top-0 right-0 w-[600px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 z-10">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
            <p className="text-sm font-medium tracking-wide animate-pulse">Loading problem data...</p>
          </div>
        ) : activeProblem ? (
          <div className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8 pb-32 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">

            {/* PREMIUM STICKY HEADER */}
            <header className="top-4 z-40 rounded-2xl border border-slate-700/50 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/50 p-5 md:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all ring-1 ring-white/5">
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                  {activeProblem.title || activeProblem.name}
                </h2>

                <div className="flex flex-wrap gap-2 mt-1 items-center">
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {activeProblem.difficulty || "Medium"}
                  </span>
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    C++
                  </span>

                  <div className="h-4 w-px bg-slate-700 mx-2"></div>

                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Eye className="w-3.5 h-3.5" />
                    {stats.vizViewCount} Views
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Copy className="w-3.5 h-3.5" />
                    {stats.copyCount} Copies
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleAddToSession}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 hover:border-slate-500"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Session
                  </button>
                  <Link
                    to={`/dsa/${activeProblem.slug}/visualize`}
                    state={{ approachIndex: activeApproachIndex }}
                    onClick={() => api.trackViz(activeProblem.slug).catch(console.error)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    Visualize Code
                  </Link>
                </div>
                <div className="text-[10px] text-indigo-300/80 font-medium flex items-center gap-1.5 w-full justify-center sm:justify-end pr-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  Tap Visualize to see execution step-by-step
                </div>
              </div>
            </header>

            {/* Approach Selector */}
            {hasApproaches && (
              <div className="flex border-b border-slate-800 gap-6">
                {allApproaches.map((appr, idx) => (
                  <button
                    key={appr.id || idx}
                    onClick={() => setActiveApproachIndex(idx)}
                    className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                      activeApproachIndex === idx
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    Approach {idx + 1}{appr.title ? `: ${appr.title}` : ""}
                  </button>
                ))}
              </div>
            )}

            {/* Complexity & Edge Cases Analyzer */}
            <CodeAnalyzer
              slug={activeProblem.slug}
              timeComplexity={displayTime}
              spaceComplexity={displaySpace}
              edgeCases={activeProblem.edgeCases || []}
              approachNotes={displayNotes}
              visualHtml={currentApproach?.visualHtml || activeProblem?.visualHtml}
            />

            {/* Code Snippet Viewer with Actions */}
            <CodeViewer code={displayCode} slug={activeProblem.slug} />

            {/* Historical Solutions / Re-solves */}
            {historicalSolutions.length > 0 && (
              <div className="mt-12 space-y-8 animate-in fade-in duration-500 delay-200">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Past Submissions</h3>
                    <p className="text-xs text-slate-400 mt-1">Your previous successfully synced solutions</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {historicalSolutions.map((sol, i) => (
                    <div key={sol.id} className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-slate-800 rounded-full" />
                      <div className="absolute -left-4 top-5 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                      
                      <div className="pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-300">{sol.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
                            Attempt #{historicalSolutions.length - i + 1}
                          </span>
                        </div>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden">
                          <div className="p-4 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed bg-[#0d1117]">
                            <pre><code>{sol.cppCode}</code></pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floating Notes applied to the active problem */}
            <FloatingNoteWidget slug={activeProblem.slug} />

          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-slate-500 z-10 animate-in fade-in duration-1000">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <p className="text-lg font-medium tracking-wide text-slate-400">Select a problem from the sidebar to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
}
