import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

function StatPill({ label, value, tone }) {
  const tones = {
    time: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
    space: "bg-violet-500/10 text-violet-300 ring-violet-500/30",
  };
  return (
    <div className={`rounded-lg px-4 py-3 ring-1 ${tones[tone]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold">{value || "—"}</p>
    </div>
  );
}

/**
 * Sits above the code/solution block. Renders complexity stats, edge cases,
 * approach notes, and an optional author-supplied HTML/SVG visualization
 * of the algorithm's logic (e.g. a pointer-movement diagram).
 */
export default function CodeAnalyzer({
  slug,
  timeComplexity,
  spaceComplexity,
  edgeCases = [],
  approachNotes,
  visualHtml,
  initialVizViewCount = 0,
}) {
  const [vizCount, setVizCount] = useState(initialVizViewCount);

  useEffect(() => {
    setVizCount(initialVizViewCount);
  }, [initialVizViewCount]);

  let finalHtml = visualHtml || "";
  const iframeMatch = finalHtml.match(/<iframe[^>]*srcdoc="([^"]*)"/i);
  if (iframeMatch) {
    // Convert HTML entities if it was escaped
    finalHtml = iframeMatch[1]
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  const isFullHtml = finalHtml && (finalHtml.toLowerCase().includes('<html') || finalHtml.toLowerCase().includes('<script'));

  return (
    <section className="rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-900/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Code Analyzer
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatPill label="Time Complexity" value={timeComplexity} tone="time" />
        <StatPill label="Space Complexity" value={spaceComplexity} tone="space" />
      </div>

      {approachNotes && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Approach
          </p>
          <p className="text-sm leading-relaxed text-slate-300">{approachNotes}</p>
        </div>
      )}

      {edgeCases.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Edge Cases
          </p>
          <ul className="space-y-1.5">
            {edgeCases.map((edge, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5 text-amber-400">⚠</span>
                <span>{edge}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Author-authored HTML/SVG visualization of the logic (e.g. pointer diagram).
      {visualHtml && (
        <div className="mt-6 flex flex-col items-center">
          {isFullHtml ? (
            <Link
              to={`/dsa/${slug}/visualize`}
              className="group relative flex w-full max-w-sm flex-col items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-6 py-4 transition-all hover:bg-indigo-500/20 hover:border-indigo-500/50 cursor-pointer text-decoration-none"
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="font-semibold">View Fullscreen Visualization</span>
              </div>
              <div className="text-xs text-indigo-300/70">
                Viewed {vizCount} times
              </div>
            </Link>
          ) : (
            <div
              className="mt-4 w-full overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3"
              dangerouslySetInnerHTML={{ __html: visualHtml }}
            />
          )}
        </div> */}
      {/* )} */}
    </section>
  );
}
