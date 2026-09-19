import { useEffect, useState, useRef, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, FileText, Bookmark } from "lucide-react";

// Define the C++ code exactly, structured for UI rendering
const cppCodeLines = [
    { num: 1,  code: `<span class="text-[#e5c07b]">bool</span> <span class="text-[#61afef]">isSafe</span>(<span class="text-[#e5c07b]">vector</span>&lt;<span class="text-[#e5c07b]">string</span>&gt; &board, <span class="text-[#e5c07b]">int</span> row, <span class="text-[#e5c07b]">int</span> col, <span class="text-[#e5c07b]">int</span> n) {` },
    { num: 2,  code: `    <span class="text-[#7f848e] italic">// vertical check</span>` },
    { num: 3,  code: `    <span class="text-[#c678dd]">for</span>(<span class="text-[#e5c07b]">int</span> i=<span class="text-[#d19a66]">0</span>; i&lt;row; i++) {` },
    { num: 4,  code: `        <span class="text-[#c678dd]">if</span>(board[i][col] <span class="text-[#56b6c2]">==</span> <span class="text-[#98c379]">'Q'</span>) <span class="text-[#c678dd]">return false</span>;` },
    { num: 5,  code: `    }` },
    { num: 6,  code: `    <span class="text-[#7f848e] italic">// left diagonal</span>` },
    { num: 7,  code: `    <span class="text-[#c678dd]">for</span>(<span class="text-[#e5c07b]">int</span> i=row-<span class="text-[#d19a66]">1</span>, j=col-<span class="text-[#d19a66]">1</span>; i&gt;=<span class="text-[#d19a66]">0</span> <span class="text-[#56b6c2]">&amp;&amp;</span> j&gt;=<span class="text-[#d19a66]">0</span>; i--, j--) {` },
    { num: 8,  code: `        <span class="text-[#c678dd]">if</span>(board[i][j] <span class="text-[#56b6c2]">==</span> <span class="text-[#98c379]">'Q'</span>) <span class="text-[#c678dd]">return false</span>;` },
    { num: 9,  code: `    }` },
    { num: 10, code: `    <span class="text-[#7f848e] italic">// right diagonal</span>` },
    { num: 11, code: `    <span class="text-[#c678dd]">for</span>(<span class="text-[#e5c07b]">int</span> i=row-<span class="text-[#d19a66]">1</span>, j=col+<span class="text-[#d19a66]">1</span>; i&gt;=<span class="text-[#d19a66]">0</span> <span class="text-[#56b6c2]">&amp;&amp;</span> j&lt;n; i--, j++) {` },
    { num: 12, code: `        <span class="text-[#c678dd]">if</span>(board[i][j] <span class="text-[#56b6c2]">==</span> <span class="text-[#98c379]">'Q'</span>) <span class="text-[#c678dd]">return false</span>;` },
    { num: 13, code: `    }` },
    { num: 14, code: `    <span class="text-[#c678dd]">return true</span>;` },
    { num: 15, code: `}` },
    { num: 16, code: `` },
    { num: 17, code: `<span class="text-[#e5c07b]">void</span> <span class="text-[#61afef]">nQueens</span>(<span class="text-[#e5c07b]">vector</span>&lt;<span class="text-[#e5c07b]">string</span>&gt; &board, <span class="text-[#e5c07b]">int</span> row, <span class="text-[#e5c07b]">int</span> n, <span class="text-[#e5c07b]">vector</span>&lt;<span class="text-[#e5c07b]">vector</span>&lt;<span class="text-[#e5c07b]">string</span>&gt;&gt; &ans) {` },
    { num: 18, code: `    <span class="text-[#c678dd]">if</span>(row <span class="text-[#56b6c2]">==</span> n) {` },
    { num: 19, code: `        ans.push_back(board);` },
    { num: 20, code: `        <span class="text-[#c678dd]">return</span>;` },
    { num: 21, code: `    }` },
    { num: 22, code: `    <span class="text-[#c678dd]">for</span>(<span class="text-[#e5c07b]">int</span> j=<span class="text-[#d19a66]">0</span>; j&lt;n; j++) {` },
    { num: 23, code: `        <span class="text-[#c678dd]">if</span>(<span class="text-[#61afef]">isSafe</span>(board, row, j, n)) {` },
    { num: 24, code: `            board[row][j] <span class="text-[#56b6c2]">=</span> <span class="text-[#98c379]">'Q'</span>;` },
    { num: 25, code: `            <span class="text-[#61afef]">nQueens</span>(board, row+<span class="text-[#d19a66]">1</span>, n, ans);` },
    { num: 26, code: `            board[row][j] <span class="text-[#56b6c2]">=</span> <span class="text-[#98c379]">'.'</span>; <span class="text-[#7f848e] italic">// Backtrack</span>` },
    { num: 27, code: `        }` },
    { num: 28, code: `    }` },
    { num: 29, code: `}` }
];

export default function NQueensVisualizer({ 
    currentStep, 
    onStepChange, 
    onReady, 
    isPlaying 
}) {
    const N = 4;
    const codeRef = useRef(null);
    const [history, setHistory] = useState([]);

    // Precompute history on mount
    useEffect(() => {
        const simBoard = Array(N).fill().map(() => Array(N).fill('.'));
        const hist = [];

        function recordState(line, msg, highlights = [], type = 'target', vars = {}) {
            hist.push({
                board: simBoard.map(r => [...r]),
                line,
                msg,
                highlights,
                type,
                vars: {
                    n: N,
                    row: vars.row !== undefined ? vars.row : '-',
                    j: vars.j !== undefined ? vars.j : '-',
                    col: vars.col !== undefined ? vars.col : '-',
                    i: vars.i !== undefined ? vars.i : '-'
                }
            });
        }

        function simulateNQueens(row) {
            recordState(18, `Checking base case: row == n (${row} == ${N})`, [], 'target', { row });
            if (row === N) {
                recordState(19, `<strong>Solution Found!</strong> Saving board to ans.`, [], 'safe', { row });
                recordState(20, `Returning from solution.`, [], 'safe', { row });
                return;
            }

            recordState(22, `Entering loop for columns j in row ${row}.`, [], 'target', { row });
            for (let j = 0; j < N; j++) {
                recordState(23, `Calling <code>isSafe(board, ${row}, ${j}, ${N})</code>`, [{r: row, c: j, type: 'target'}], 'target', { row, j });
                
                let safe = true;
                let col = j;
                
                recordState(3, `Inside <code>isSafe</code>: Checking vertical column ${col}.`, [{r: row, c: j, type: 'target'}], 'target', { row, col });
                for (let i = 0; i < row; i++) {
                    if (simBoard[i][col] === 'Q') {
                        safe = false;
                        recordState(4, `<strong>Conflict!</strong> Vertical clash at (${i}, ${col}). Returns false.`, [
                            {r: row, c: j, type: 'target'},
                            {r: i, c: col, type: 'danger'}
                        ], 'danger', { row, col, i });
                        break;
                    }
                }

                if (safe) {
                    recordState(7, `Inside <code>isSafe</code>: Checking left diagonal.`, [{r: row, c: j, type: 'target'}], 'target', { row, col });
                    for (let i = row - 1, c = col - 1; i >= 0 && c >= 0; i--, c--) {
                        if (simBoard[i][c] === 'Q') {
                            safe = false;
                            recordState(8, `<strong>Conflict!</strong> Left diagonal clash at (${i}, ${c}). Returns false.`, [
                                {r: row, c: j, type: 'target'},
                                {r: i, c: c, type: 'danger'}
                            ], 'danger', { row, col, i });
                            break;
                        }
                    }
                }

                if (safe) {
                    recordState(11, `Inside <code>isSafe</code>: Checking right diagonal.`, [{r: row, c: j, type: 'target'}], 'target', { row, col });
                    for (let i = row - 1, c = col + 1; i >= 0 && c < N; i--, c++) {
                        if (simBoard[i][c] === 'Q') {
                            safe = false;
                            recordState(12, `<strong>Conflict!</strong> Right diagonal clash at (${i}, ${c}). Returns false.`, [
                                {r: row, c: j, type: 'target'},
                                {r: i, c: c, type: 'danger'}
                            ], 'danger', { row, col, i });
                            break;
                        }
                    }
                }

                if (!safe) continue;

                recordState(14, `<code>isSafe</code> returns <strong>true</strong>. Space is clear.`, [{r: row, c: j, type: 'safe'}], 'safe', { row, col });
                
                simBoard[row][j] = 'Q';
                recordState(24, `Placing Queen at (${row}, ${j}).`, [{r: row, c: j, type: 'safe'}], 'safe', { row, j });
                
                recordState(25, `Recursive call for next row: <code>nQueens(board, ${row+1}, ${N}, ans)</code>`, [], 'target', { row, j });
                simulateNQueens(row + 1);

                recordState(26, `<strong>Backtracking!</strong> Execution returns to row ${row}. Removing Queen from (${row}, ${j}).`, [{r: row, c: j, type: 'backtrack'}], 'backtrack', { row, j });
                simBoard[row][j] = '.';
            }
        }

        recordState(17, `Initial Call: <code>nQueens(board, row=0, n=4, ans)</code>`, [], 'target', { row: 0 });
        simulateNQueens(0);
        recordState(29, `<strong>Execution Complete.</strong> Algorithm has finished exploring all possibilities.`, [], 'safe', { row: '-' });

        setHistory(hist);
        if (onReady) onReady(hist.length);
    }, []); // Run only once

    // Auto-play logic
    useEffect(() => {
        let interval;
        if (isPlaying && history.length > 0) {
            interval = setInterval(() => {
                if (currentStep < history.length - 1) {
                    onStepChange(currentStep + 1);
                }
            }, 800);
        }
        return () => clearInterval(interval);
    }, [isPlaying, currentStep, history.length, onStepChange]);

    // Scroll active line into view without moving the outer browser window
    useEffect(() => {
        if (!history.length || currentStep >= history.length) return;
        const state = history[currentStep];
        const activeLine = document.getElementById(`line-${state.line}`);
        
        if (activeLine && codeRef.current) {
            const container = codeRef.current;
            
            // Calculate the target scroll position to center the line
            // inside the code container itself, preventing page-level jumping
            const targetScrollTop = 
                activeLine.offsetTop - (container.clientHeight / 2) + (activeLine.clientHeight / 2);
            
            container.scrollTo({ 
                top: targetScrollTop, 
                behavior: 'smooth' 
            });
        }
    }, [currentStep, history]);

    if (!history.length) return null;

    const state = history[Math.min(currentStep, history.length - 1)];

    // Type-based styling for status panel
    let statusBorder = 'border-yellow-400';
    if (state.type === 'danger') statusBorder = 'border-red-500';
    if (state.type === 'safe') statusBorder = 'border-green-500';
    if (state.type === 'backtrack') statusBorder = 'border-blue-500';

    return (
        <div className="w-full h-full flex flex-col p-4 md:p-6 bg-[#0f172a] text-slate-100 font-sans overflow-y-auto">
            
            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                
                {/* Left Panel: Board & Status */}
                <div className="flex-1 flex flex-col gap-6 p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-y-auto">
                    
                    {/* Chessboard */}
                    <div className="flex-1 flex items-center justify-center min-h-[300px]">
                        <div className="bg-slate-700 p-2 rounded-lg inline-block shadow-2xl">
                            <div 
                                className="grid border-2 border-slate-700"
                                style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
                            >
                                {state.board.map((row, r) => row.map((cell, c) => {
                                    const isDark = (r + c) % 2 === 1;
                                    const highlight = state.highlights.find(h => h.r === r && h.c === c);
                                    
                                    let cellStyle = "w-10 h-10 sm:w-16 sm:h-16 flex justify-center items-center text-2xl sm:text-4xl font-bold transition-all duration-300";
                                    let bgClass = isDark ? "bg-slate-400" : "bg-slate-200";
                                    let textClass = "text-slate-900";
                                    let customStyle = {};

                                    if (highlight) {
                                        if (highlight.type === 'target') {
                                            bgClass = "bg-yellow-400";
                                            customStyle = { boxShadow: "inset 0 0 15px rgba(0,0,0,0.4)" };
                                        }
                                        else if (highlight.type === 'danger') {
                                            bgClass = "bg-red-500 animate-[pulse_0.4s_ease-in-out_infinite]";
                                            textClass = "text-white";
                                        }
                                        else if (highlight.type === 'safe') {
                                            bgClass = "bg-green-500";
                                            textClass = "text-white";
                                        }
                                        else if (highlight.type === 'backtrack') {
                                            bgClass = "bg-blue-500";
                                            textClass = "text-white";
                                        }
                                    }

                                    return (
                                        <div 
                                            key={`${r}-${c}`} 
                                            className={`${cellStyle} ${bgClass} ${textClass}`}
                                            style={customStyle}
                                        >
                                            {cell === 'Q' ? '♛' : ''}
                                        </div>
                                    );
                                }))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Live Scope Variables */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-lg shrink-0">
                        <div className="text-slate-300 font-semibold flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                            Live Scope Variables:
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {['n', 'row', 'j', 'col', 'i'].map(v => (
                                <div key={v} className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded flex items-center gap-2 min-w-[85px] justify-between">
                                    <span className={`font-mono text-sm ${
                                        v==='n'?'text-indigo-400':
                                        v==='row'?'text-emerald-400':
                                        v==='j'?'text-amber-400':
                                        v==='col'?'text-rose-400':'text-sky-400'
                                    }`}>{v}</span>
                                    <span className="text-slate-500">=</span>
                                    <span className="text-white font-mono font-bold">{state.vars[v]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Panel */}
                    <div className={`bg-slate-900 p-4 rounded-lg border-l-[5px] ${statusBorder} min-h-[80px] flex items-center text-[1.1rem] transition-colors duration-300 shadow-inner shrink-0`}>
                        <div dangerouslySetInnerHTML={{ __html: state.msg }} />
                    </div>
                </div>

                {/* Right Panel: Code Viewer */}
                <div className="flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                    <h2 className="text-lg font-bold p-4 bg-slate-800 border-b border-slate-700 text-white flex items-center justify-between shrink-0">
                        <span>C++ Backtracking Code</span>
                        <span className="text-xs font-normal text-slate-400 bg-slate-900 px-2 py-1 rounded">Synced with execution</span>
                    </h2>
                    <div 
                        ref={codeRef}
                        className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
                    >
                        {cppCodeLines.map(({ num, code }) => {
                            const isActive = state.line === num;
                            let activeClass = "";
                            if (isActive) {
                                if (state.type === 'target') activeClass = "bg-yellow-400/15 border-yellow-400";
                                else if (state.type === 'danger') activeClass = "bg-red-500/15 border-red-500";
                                else if (state.type === 'safe') activeClass = "bg-green-500/15 border-green-500";
                                else if (state.type === 'backtrack') activeClass = "bg-blue-500/15 border-blue-500";
                            }
                            
                            return (
                                <div 
                                    key={num} 
                                    id={`line-${num}`}
                                    className={`px-4 py-0.5 flex border-l-4 transition-colors ${isActive ? activeClass : 'border-transparent text-slate-300'}`}
                                >
                                    <span className="text-slate-500 min-w-[30px] mr-4 text-right select-none">{num}</span>
                                    <span dangerouslySetInnerHTML={{ __html: code }} className="whitespace-pre" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
