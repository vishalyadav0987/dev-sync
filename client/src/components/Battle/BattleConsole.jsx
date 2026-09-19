import React from 'react';
import { Code2, TerminalSquare, Lock } from 'lucide-react';

// Maps a verdict status to what the header should show. Previously this
// was a binary `status === 'success' ? 'Accepted' : 'Wrong Answer'`, so a
// compile error, a timeout, or the execution engine being unreachable all
// displayed as "Wrong Answer" — misleading the player about what actually
// happened (and matching the backend's own now-fixed status reporting).
const STATUS_META = {
  ACCEPTED: { label: 'Accepted', color: 'text-emerald-500' },
  WRONG_ANSWER: { label: 'Wrong Answer', color: 'text-rose-500' },
  COMPILE_ERROR: { label: 'Compile Error', color: 'text-amber-500' },
  RUNTIME_ERROR: { label: 'Runtime Error', color: 'text-rose-500' },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded', color: 'text-amber-500' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory Limit Exceeded', color: 'text-amber-500' },
  SERVICE_UNAVAILABLE: { label: 'Execution Service Unavailable', color: 'text-orange-400' },
  UNSUPPORTED_LANGUAGE: { label: 'Unsupported Language', color: 'text-amber-500' },
  ERROR: { label: 'Error', color: 'text-rose-500' },
  error: { label: 'Error', color: 'text-rose-500' },
};

function getStatusMeta(status) {
  return STATUS_META[status] || {
    label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
    color: 'text-rose-500'
  };
}

function formatRuntime(ms) {
  if (ms === undefined || ms === null) return null;
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function BattleConsole({
  problem,
  status,
  output,
  testResults,
  activeTab,
  setActiveTab,
  activeTestCase,
  setActiveTestCase
}) {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-bl-xl overflow-hidden">
      {/* Console Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('testcases')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${activeTab === 'testcases' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
        >
          <Code2 size={14} /> Testcases
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${activeTab === 'results' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
        >
          <TerminalSquare size={14} /> Test Results
        </button>
      </div>

      {/* Console Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 font-mono text-sm bg-slate-900/60">

        {activeTab === 'testcases' && (
          <div className="h-full flex flex-col">
            {problem?.testCases && problem.testCases.length > 0 ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1">
                  {problem.testCases.map((tc, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTestCase(idx)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 ${activeTestCase === idx ? 'bg-slate-700 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Input:</div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-xs">
                      {typeof problem.testCases[activeTestCase]?.input === 'object' ? JSON.stringify(problem.testCases[activeTestCase]?.input) : String(problem.testCases[activeTestCase]?.input || '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Expected Output:</div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-xs">
                      {typeof (problem.testCases[activeTestCase]?.expected || problem.testCases[activeTestCase]?.output) === 'object' ? JSON.stringify(problem.testCases[activeTestCase]?.expected || problem.testCases[activeTestCase]?.output) : String(problem.testCases[activeTestCase]?.expected || problem.testCases[activeTestCase]?.output || '')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600 italic">No testcases available.</div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="h-full flex flex-col">
            {status === 'idle' || status === 'running' ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 italic">
                {status === 'running' ? 'Running code...' : 'Run or submit your code to see results here.'}
              </div>
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center gap-4 mb-4 shrink-0">
                  <h3 className={`text-xl font-black tracking-tight ${getStatusMeta(status).color}`}>
                    {getStatusMeta(status).label}
                  </h3>
                  {testResults && formatRuntime(testResults.maxRuntimeMs) && (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                      Runtime: {formatRuntime(testResults.maxRuntimeMs)}
                    </span>
                  )}
                </div>

                {testResults ? (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1">
                      {testResults.cases.map((tc, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCase(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 ${activeTestCase === idx
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${tc.status === 'PASSED' ? 'bg-emerald-500' : (tc.status === 'SKIPPED' ? 'bg-slate-500' : 'bg-rose-500')}`} />
                          {tc.isPublic ? `Case ${idx + 1}` : `Hidden ${idx + 1}`}
                          {!tc.isPublic && <Lock size={12} className="ml-1 opacity-50" />}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {!testResults.cases[activeTestCase]?.isPublic ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 pt-8">
                          <Lock size={32} className="opacity-50" />
                          <p className="font-semibold text-sm">Hidden Test Case</p>
                          <p className="text-xs text-center max-w-xs px-4 opacity-75">
                            Input and expected output are hidden to prevent hardcoding solutions.
                          </p>
                          {testResults.cases[activeTestCase]?.status !== 'PASSED' && testResults.cases[activeTestCase]?.status !== 'SKIPPED' && (
                            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 text-xs text-center max-w-xs">
                              Failed: {testResults.cases[activeTestCase]?.message || testResults.cases[activeTestCase]?.status?.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Input:</div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-xs">
                              {typeof testResults.cases[activeTestCase]?.input === 'object' ? JSON.stringify(testResults.cases[activeTestCase]?.input) : String(testResults.cases[activeTestCase]?.input || '')}
                            </div>
                          </div>
                          <div className="mb-4">
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Expected:</div>
                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap text-xs">
                              {typeof testResults.cases[activeTestCase]?.expected === 'object' ? JSON.stringify(testResults.cases[activeTestCase]?.expected) : String(testResults.cases[activeTestCase]?.expected || '')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wider">Output:</div>
                            <div className={`bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap text-xs ${testResults.cases[activeTestCase]?.status === 'PASSED' ? 'text-slate-300' : 'text-rose-400'
                              }`}>
                              {testResults.cases[activeTestCase]?.status !== 'PASSED' && testResults.cases[activeTestCase]?.message ? (
                                <>
                                  <span className="text-rose-500 font-bold block mb-1">Error: {testResults.cases[activeTestCase].message}</span>
                                  {typeof testResults.cases[activeTestCase]?.actual === 'object' ? JSON.stringify(testResults.cases[activeTestCase]?.actual) : String(testResults.cases[activeTestCase]?.actual || '')}
                                </>
                              ) : (
                                typeof testResults.cases[activeTestCase]?.actual === 'object' ? JSON.stringify(testResults.cases[activeTestCase]?.actual) : String(testResults.cases[activeTestCase]?.actual || '')
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <pre className={`flex-1 overflow-auto whitespace-pre-wrap ${status === 'error' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {typeof output === 'object' ? JSON.stringify(output) : String(output || '')}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
