import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { generateTemplate } from './templateGenerator';

export function BattleEditor({ 
  room, 
  problem, 
  socket, 
  uuid,
  onStatusChange,
  onOutputChange,
  onTestResultsChange,
  setActiveTab,
  setActiveTestCase,
  isConsoleOpen,
  setIsConsoleOpen
}) {
  const navigate = useNavigate();
  const [codeMap, setCodeMap] = useState({});
  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const code = codeMap[problem.id] || '';

  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Restore code from local storage on problem change
  useEffect(() => {
    const saved = localStorage.getItem(`battle_code_${room.roomId}_${problem.id}_${language}`);
    if (saved) {
      setCodeMap(prev => ({ ...prev, [problem.id]: saved }));
    } else {
      let defaultCode = generateTemplate(
        language, 
        problem?.functionName, 
        problem?.returnType, 
        problem?.paramTypes, 
        problem?.paramNames
      );
      setCodeMap(prev => ({ ...prev, [problem.id]: defaultCode }));
    }
  }, [room.roomId, problem.id, language]);

  // Anti-cheat: Tab switching detection
  useEffect(() => {
    if (room.status !== 'ACTIVE') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setWarnings(w => {
          const newW = w + 1;
          if (newW <= 3) {
            setShowWarningModal(true);
          }
          return newW;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [room.status]);

  const handleEditorChange = (value) => {
    setCodeMap(prev => ({ ...prev, [problem.id]: value }));
    localStorage.setItem(`battle_code_${room.roomId}_${problem.id}_${language}`, value);
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    onStatusChange(problem.id, 'running');
    onOutputChange(problem.id, 'Queueing code execution...\n');
    setIsConsoleOpen(true);

    try {
      const data = await api.runBattleCode({
        roomId: room.roomId,
        uuid,
        code,
        language,
        problemId: problem.id
      });
      
      onOutputChange(problem.id, data.message || 'Job queued. Waiting for execution worker...');
      setActiveTab('results');
      setActiveTestCase(0);
      
    } catch (err) {
      onOutputChange(problem.id, err.message);
      onStatusChange(problem.id, 'error');
      setActiveTab('results');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setIsSubmitting(true);
    onStatusChange(problem.id, 'running');
    onOutputChange(problem.id, 'Queueing submission against hidden test cases...\n');
    setIsConsoleOpen(true);

    try {
      const data = await api.submitBattleCode({
        roomId: room.roomId,
        uuid,
        code,
        language,
        problemId: problem.id
      });
      
      onOutputChange(problem.id, data.message || 'Submission queued. Waiting for execution worker...');
      setActiveTab('results');
      setActiveTestCase(0);
      
    } catch (err) {
      onOutputChange(problem.id, err.message);
      onStatusChange(problem.id, 'error');
      setActiveTab('results');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#030712] relative"
      onPaste={(e) => {
        setWarnings(w => {
          const newW = w + 1;
          if (newW <= 3) {
            setShowWarningModal(true);
          }
          return newW;
        });
      }}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
        
        <div className="flex items-center gap-2">
          {warnings > 0 && (
             <div className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded">
               Warnings: {warnings}/3
             </div>
          )}
          <button 
            onClick={handleRun}
            disabled={isRunning || isSubmitting || warnings >= 3}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Run Tests
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || warnings >= 3}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-[#0d1117]">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            roundedSelection: false,
            wordWrap: 'on',
            readOnly: warnings >= 3,
            smoothScrolling: true,
            cursorBlinking: "smooth"
          }}
        />
      </div>

      {/* Warning Modal Overlay */}
      {showWarningModal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#030712]/90 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)] rounded-2xl p-8 text-center max-w-sm w-full animate-in zoom-in duration-200">
            <div className="text-5xl mb-4 text-rose-500 flex justify-center"><XCircle size={64}/></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {warnings >= 3 ? "DISQUALIFIED" : "WARNING"}
            </h2>
            <p className="text-slate-300 mb-6 font-medium">
              {warnings >= 3 
                ? "You have been disqualified for switching tabs or copy-pasting multiple times." 
                : `Tab switching or copy-pasting detected! Continuing to do so will result in disqualification. (${warnings}/3)`}
            </p>
            {warnings < 3 ? (
              <button 
                onClick={() => setShowWarningModal(false)}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
              >
                I Understand
              </button>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition"
              >
                Exit Room
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
