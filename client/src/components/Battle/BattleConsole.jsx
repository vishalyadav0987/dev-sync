import React from 'react';
import { Code2, TerminalSquare } from 'lucide-react';

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
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'testcases' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Code2 size={14} /> Testcases
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'results' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
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
                       className={`px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 ${
                         activeTestCase === idx ? 'bg-slate-700 text-white' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
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
                   <h3 className={`text-xl font-black tracking-tight ${status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                     {status === 'success' ? 'Accepted' : 'Wrong Answer'}
                   </h3>
                   {testResults && (
                     <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                       Runtime: {testResults.runtime}
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
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 ${
                             activeTestCase === idx 
                               ? 'bg-slate-700 text-white' 
                               : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                           }`}
                         >
                           <div className={`w-1.5 h-1.5 rounded-full ${tc.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                           Case {idx + 1}
                         </button>
                       ))}
                     </div>
                     
                     <div className="flex-1 overflow-y-auto">
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
                         <div className={`bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap text-xs ${
                           testResults.cases[activeTestCase]?.passed ? 'text-slate-300' : 'text-rose-400'
                         }`}>
                           {typeof testResults.cases[activeTestCase]?.actual === 'object' ? JSON.stringify(testResults.cases[activeTestCase]?.actual) : String(testResults.cases[activeTestCase]?.actual || '')}
                         </div>
                       </div>
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
