import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Check, X as XIcon, SkipForward, LayoutGrid, Bot, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { STAGES, DIFFICULTY_COLOR } from "../../lib/sessionHelpers";

export default function CurrentProblemPanel({ session, current, onChanged, onMarkFailed }) {
  const navigate = useNavigate();
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  if (!current) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
          <LayoutGrid className="h-7 w-7 text-indigo-400" />
        </div>
        <h3 className="text-base font-bold text-white">Pick a problem to start</h3>
        <p className="mt-1.5 max-w-xs text-sm text-slate-500">
          Select a problem from the queue on the left — or add one — to begin solving.
        </p>
      </div>
    );
  }

  const stageIndex = Math.max(0, STAGES.findIndex((s) => s.key === current.stage));

  const setStage = async (stage) => {
    if (current.status === "NOT_STARTED") await api.startSessionProblem(session.id, current.problemId);
    await api.setSessionProblemStage(session.id, current.problemId, stage);
    onChanged();
  };

  const start = async () => {
    await api.startSessionProblem(session.id, current.problemId);
    onChanged();
  };

  const markSolved = async () => {
    await api.solveSessionProblem(session.id, current.problemId, {});
    onChanged();
  };

  const markFailed = async () => {
    await api.failSessionProblem(session.id, current.problemId);
    onChanged();
    onMarkFailed?.(current);
  };

  const skip = async () => {
    await api.skipSessionProblem(session.id, current.problemId);
    onChanged();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Current Problem</p>
      <h2 className="mt-1 text-2xl font-bold text-white">{current.problem.title}</h2>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <span className={`font-bold uppercase tracking-wide ${DIFFICULTY_COLOR[current.problem.difficulty]}`}>{current.problem.difficulty}</span>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400">{current.problem.tags?.[0] || session.category || "General"}</span>
        {current.attempts > 0 && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">Attempt #{current.attempts + 1}</span>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/dsa/${current.problem.slug}/visualize`)}
          className="mt-4 flex w-fit items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-indigo-500/40 hover:text-white transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Open Problem
        </button>
        <button
          onClick={() => setShowAnalyzer(!showAnalyzer)}
          className={`mt-4 flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            showAnalyzer 
              ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300" 
              : "border-white/10 text-slate-300 hover:border-indigo-500/40 hover:text-white"
          }`}
        >
          <Bot className="h-3.5 w-3.5" /> AI Analyzer
        </button>
      </div>

      {showAnalyzer && (
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
          <h3 className="text-sm font-bold text-white mb-2">Custom AI Analyzer</h3>
          <p className="text-xs text-slate-400 mb-3">Enter a custom input array (or variables) to analyze how the code handles it.</p>
          <textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="e.g. [1, 2, 3, 4, 5]"
            className="w-full h-20 rounded-lg bg-slate-900 border border-slate-700 p-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={async () => {
              setAnalyzing(true);
              setAnalysisResult(null);
              try {
                const res = await api.analyzeProblem(current.problem.slug, customInput);
                setAnalysisResult(res);
              } catch (err) {
                console.error(err);
                alert("Analysis failed. Ensure GEMINI_API_KEY is configured.");
              } finally {
                setAnalyzing(false);
              }
            }}
            disabled={analyzing}
            className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            {analyzing ? "Analyzing..." : "Analyze with Gemini"}
          </button>

          {analysisResult && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800">
                <h4 className="text-xs font-bold text-indigo-400 mb-1">Problem Statement</h4>
                <p className="text-sm text-slate-300">{analysisResult.statement}</p>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800">
                <h4 className="text-xs font-bold text-emerald-400 mb-1">Approach Notes</h4>
                <p className="text-sm text-slate-300">{analysisResult.approachNotes}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800">
                  <h4 className="text-xs font-bold text-amber-400 mb-1">Time Complexity</h4>
                  <p className="text-sm text-slate-300 font-mono">{analysisResult.timeComplexity}</p>
                </div>
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800">
                  <h4 className="text-xs font-bold text-fuchsia-400 mb-1">Space Complexity</h4>
                  <p className="text-sm text-slate-300 font-mono">{analysisResult.spaceComplexity}</p>
                </div>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800">
                <h4 className="text-xs font-bold text-rose-400 mb-1">Edge Cases</h4>
                <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                  {analysisResult.edgeCases?.map((ec, i) => (
                    <li key={i}>{ec}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800 flex flex-wrap gap-1.5">
                <h4 className="text-xs font-bold text-sky-400 mb-1 w-full">Tags</h4>
                {analysisResult.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold uppercase tracking-wider">{tag}</span>
                ))}
              </div>
              
              {analysisResult.visualHtml && (
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-800 mt-4 flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-violet-400 mb-1">Custom Interactive Analyzer</h4>
                  <p className="text-xs text-slate-400">Auto-generated by Gemini to test your logic.</p>
                  <iframe 
                    srcDoc={analysisResult.visualHtml}
                    className="w-full h-80 border border-slate-700/50 rounded-lg bg-white"
                    sandbox="allow-scripts allow-same-origin"
                    title="Custom Analyzer"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Solving stage flow */}
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold text-slate-400">Progress</p>
        <div className="flex items-center overflow-x-auto pb-2 scrollbar-none min-w-[400px]">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <button
                onClick={() => setStage(s.key)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  i < stageIndex
                    ? "bg-emerald-500/20 text-emerald-300"
                    : i === stageIndex
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                }`}
              >
                {s.label}
              </button>
              {i < STAGES.length - 1 && <div className={`h-px flex-1 ${i < stageIndex ? "bg-emerald-500/40" : "bg-slate-800"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {current.status === "NOT_STARTED" ? (
          <button onClick={start} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-colors">
            Start Solving
          </button>
        ) : (
          <>
            <button
              onClick={markSolved}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
            >
              <Check className="h-3.5 w-3.5" /> Mark Solved
            </button>
            <button
              onClick={markFailed}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-colors"
            >
              <XIcon className="h-3.5 w-3.5" /> Mark Failed
            </button>
            <button
              onClick={skip}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <SkipForward className="h-3.5 w-3.5" /> Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
