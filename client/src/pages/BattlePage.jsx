import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Loader2, LogOut, AlertTriangle, Clock, Users } from 'lucide-react';
import { BattleLobby } from '../components/Battle/BattleLobby';
import { BattleEditor } from '../components/Battle/BattleEditor';
import { BattlePlayerStats } from '../components/Battle/BattlePlayerStats';
import { getGuestId } from '../hooks/useGuestId';
import { api, ASSET_BASE_URL } from '../lib/api';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { BattleConsole } from '../components/Battle/BattleConsole';

export default function BattlePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [problems, setProblems] = useState([]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Execution states
  const [outputs, setOutputs] = useState({});
  const [statuses, setStatuses] = useState({});
  const [testResultsMap, setTestResultsMap] = useState({});
  const [activeTab, setActiveTab] = useState('testcases');
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const addNotification = (msg) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const socketRef = useRef(null);
  const uuid = getGuestId();

  useEffect(() => {
    if (!uuid) {
      setError("No anonymous identity found. Please visit chat first.");
      setLoading(false);
      return;
    }

    // Fetch initial room state
    api.getBattle(roomId)
      .then(data => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setRoom(data.room);
        setProblems(data.problems || [data.problem].filter(Boolean));
        setPlayers(data.players);

        if (data.rankings) {
          setResults(data.rankings);
        } else if (data.room.winnerParticipantId) {
          const w = data.players.find(p => p.participantId === data.room.winnerParticipantId);
          if (w) setWinner(w);
        }

        // Connect Socket
        const socketUrl = ASSET_BASE_URL + '/battle';
        const socket = io(socketUrl, {
          transports: ['websocket'],
          reconnection: true
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("battle:join", { uuid, roomId }, (res) => {
            if (res?.error) {
              setError(res.error);
            }
          });
        });

        socket.on("battle:player-joined", (data) => {
          setPlayers(data.players);
          if (data.room) setRoom(data.room);
          if (data.joinedParticipant && data.joinedParticipant.uuid !== uuid) {
            addNotification(`${data.joinedParticipant.displayName} joined the battle`);
          }
        });

        socket.on("battle:player-left", (data) => {
          setPlayers(data.players);
          if (data.room) setRoom(data.room);
          if (data.leftParticipant) {
            addNotification(`${data.leftParticipant.displayName} left the battle`);
          }
        });

        socket.on("battle:player-updated", (data) => {
          setPlayers(data.players);
        });

        socket.on("battle:countdown", (data) => {
          setRoom(prev => ({ ...prev, status: "COUNTDOWN", countdown: data.seconds }));
        });

        socket.on("battle:started", (data) => {
          setRoom(data.room);
        });

        socket.on("battle:winner", (data) => {
          // Backward compatibility / fallback
          setWinner(data.participant);
          if (data.room) setRoom(data.room);
        });

        socket.on("battle:results", (data) => {
          setRoom(data.room);
          setResults(data.rankings);
        });

        socket.on("battle:expired", (data) => {
          setRoom(data.room);
        });

        // Execution Events
        socket.on("execution:status", (data) => {
          setStatuses(prev => ({ ...prev, [data.problemId]: data.status }));
          if (data.message) {
            setOutputs(prev => ({ ...prev, [data.problemId]: data.message }));
          }
        });

        socket.on("execution:test-update", (data) => {
          setTestResultsMap(prev => {
            const current = prev[data.problemId] || { cases: [] };
            const newCases = [...(current.cases || [])];
            newCases[data.testIndex] = data;
            return {
              ...prev,
              [data.problemId]: {
                ...current,
                cases: newCases
              }
            };
          });
        });

        socket.on("execution:completed", (data) => {
          // Keep the real verdict (ACCEPTED, WRONG_ANSWER, COMPILE_ERROR,
          // RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, SERVICE_UNAVAILABLE, ...)
          // instead of collapsing everything down to success/error —
          // BattleConsole renders the correct label/color per status.
          setStatuses(prev => ({ ...prev, [data.problemId]: data.status }));
          setOutputs(prev => ({ ...prev, [data.problemId]: `Execution completed: ${data.status}\nPassed ${data.passed}/${data.total} tests.` }));
          setTestResultsMap(prev => ({
            ...prev,
            [data.problemId]: {
              passed: data.passed,
              total: data.total,
              maxRuntimeMs: data.maxRuntimeMs,
              cases: data.cases
            }
          }));
        });
      })
      .catch(err => {
        console.error("Battle API Error:", err);
        setError(err.message || "Failed to load battle room.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("battle:leave");
        socketRef.current.disconnect();
      }
    };
  }, [roomId, uuid]);

  // Cleanup localStorage when battle is over
  useEffect(() => {
    if (room && (room.status === 'FINISHED' || room.status === 'EXPIRED') && problems.length > 0) {
      problems.forEach(p => {
        localStorage.removeItem(`battle_code_${room.roomId}_${p.id}`);
      });
    }
  }, [room?.status, room?.roomId, problems]);

  useEffect(() => {
    if (room?.status === 'ACTIVE' && room.startedAt && room.durationMinutes) {
      const interval = setInterval(() => {
        const start = parseInt(room.startedAt, 10);
        const durationMs = room.durationMinutes * 60 * 1000;
        const now = Date.now();
        const diff = (start + durationMs) - now;
        if (diff <= 0) {
          setTimeLeft("00:00");
          clearInterval(interval);
          if (socket) {
            socket.emit("battle:time_up", { roomId: room.roomId });
          }
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [room?.status, room?.startedAt, room?.durationMinutes]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#030712]">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-[#030712] text-white">
        <h2 className="text-xl font-bold text-rose-500 mb-2">Battle Error</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  // Lobby Phase
  if (room.status === "WAITING" || room.status === "READY" || room.status === "COUNTDOWN") {
    return (
      <BattleLobby
        room={room}
        problems={problems}
        players={players}
        socket={socketRef.current}
        uuid={uuid}
      />
    );
  }

  const activeProblem = problems[activeProblemIndex] || null;

  // Active / Finished Phase
  return (
    <div className="flex-1 flex flex-col h-screen bg-[#030712] text-white">

      {/* Global Battle Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            DSA BATTLE
          </div>
          <div className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-slate-400">
            Room: {room.roomId}
          </div>

          <div className="group relative ml-2 z-50">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700 transition">
              <Users size={16} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-300">{players.length} / {room.maxPlayers} Players</span>
            </div>

            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all overflow-hidden">
              <div className="p-2">
                {players.map(p => (
                  <div key={p.participantId} className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${p.status === 'CONNECTED' ? 'bg-emerald-500' : p.status === 'DISCONNECTED' ? 'bg-rose-500' : 'bg-slate-500'}`} />
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[120px]">{p.displayName}</span>
                    </div>
                    {room.hostParticipantId === p.participantId && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">HOST</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {room.status === 'ACTIVE' && timeLeft && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full font-mono text-lg font-bold text-slate-200">
            <Clock size={18} className="text-indigo-400" />
            <span className={timeLeft.startsWith("00:") ? "text-rose-400 animate-pulse" : ""}>
              {timeLeft}
            </span>
          </div>
        )}

        <button
          onClick={() => setShowExitConfirm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-rose-400 hover:text-white hover:bg-rose-500 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Exit Room
        </button>
      </div>

      <div className="flex-1 min-h-0 p-2 pt-0 pb-2 flex flex-col gap-2">
        <PanelGroup id="outer-vertical" direction="vertical" className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          <Panel id="top-panel" defaultSize={isConsoleOpen ? 70 : 100} minSize={30}>
            <PanelGroup id="inner-horizontal" direction="horizontal" className="h-full">
              {/* Left panel: Problem Description */}
              <Panel id="problem-panel" defaultSize={40} minSize={25} className="flex flex-col bg-slate-900/80">
                {/* Tabs for Multiple Problems */}
                {problems.length > 1 && (
                  <div className="flex bg-slate-950 border-b border-slate-800 overflow-x-auto custom-scrollbar shrink-0">
                    {problems.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setActiveProblemIndex(idx)}
                        className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeProblemIndex === idx
                            ? 'border-indigo-500 text-indigo-400 bg-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                          }`}
                      >
                        P{idx + 1}: {p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}
                      </button>
                    ))}
                  </div>
                )}

                <div className="px-5 py-4 border-b border-slate-800 shrink-0 bg-slate-900">
                  <h2 className="text-xl font-bold text-slate-100">{activeProblem?.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${activeProblem?.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        activeProblem?.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                      {activeProblem?.difficulty}
                    </span>
                    <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-0.5 rounded-md">Room {room.roomId}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-900/50">
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    {activeProblem?.statement ? activeProblem.statement.split('\n').map((para, i) => (
                      <p key={i} className="leading-relaxed">{para}</p>
                    )) : <p>No statement available.</p>}
                  </div>
                </div>
              </Panel>

              {/* Resizer */}
              <PanelResizeHandle className="w-1.5 bg-slate-950 hover:bg-indigo-500/50 transition-colors cursor-col-resize relative flex items-center justify-center">
                <div className="h-8 w-1 rounded-full bg-slate-700" />
              </PanelResizeHandle>

              {/* Right panel: Editor */}
              <Panel id="editor-panel" defaultSize={60} minSize={30} className="flex flex-col min-w-0 bg-[#0d1117] relative">
                {activeProblem && (
                  <BattleEditor
                    room={room}
                    problem={activeProblem}
                    socket={socketRef.current}
                    uuid={uuid}
                    onStatusChange={(problemId, status) => setStatuses(prev => ({ ...prev, [problemId]: status }))}
                    onOutputChange={(problemId, output) => setOutputs(prev => ({ ...prev, [problemId]: output }))}
                    onTestResultsChange={(problemId, results) => setTestResultsMap(prev => ({ ...prev, [problemId]: results }))}
                    setActiveTab={setActiveTab}
                    setActiveTestCase={setActiveTestCase}
                    isConsoleOpen={isConsoleOpen}
                    setIsConsoleOpen={setIsConsoleOpen}
                  />
                )}
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Bottom Console Panel */}
          {isConsoleOpen && (
            <PanelResizeHandle className="h-1.5 bg-[#0d1117] border-y border-slate-800 hover:bg-indigo-500/50 transition-colors cursor-row-resize relative flex items-center justify-center z-10">
              <div className="w-8 h-1 rounded-full bg-slate-700" />
            </PanelResizeHandle>
          )}

          {isConsoleOpen && (
            <Panel id="console-panel" defaultSize={30} minSize={20} className="flex flex-col bg-[#0d1117]">
              <BattleConsole
                problem={activeProblem}
                status={statuses[activeProblem?.id] || 'idle'}
                output={outputs[activeProblem?.id] || ''}
                testResults={testResultsMap[activeProblem?.id] || null}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                activeTestCase={activeTestCase}
                setActiveTestCase={setActiveTestCase}
              />
            </Panel>
          )}
        </PanelGroup>

        {/* Console Toggle Footer */}
        <div className="shrink-0 flex items-center px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-sm">
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`flex items-center gap-2 px-3 py-1 text-sm font-medium rounded transition-colors ${isConsoleOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
          >
            <span>Console</span>
            <span className="text-[10px] opacity-70">
              {isConsoleOpen ? '▼' : '▲'}
            </span>
          </button>
        </div>
      </div>

      {/* Results / Winner Overlay */}
      {(results || winner) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/90 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl p-8 max-w-3xl w-full mx-4 my-8 transform animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-black text-white mb-2">BATTLE FINAL RESULTS</h2>
              <p className="text-slate-400">The battle has ended. Here are the final rankings.</p>
            </div>

            {results && results.length > 0 ? (
              <div className="mb-8 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-700 text-slate-400 text-sm">
                      <th className="p-4 font-semibold w-16 text-center">Rank</th>
                      <th className="p-4 font-semibold">Player</th>
                      <th className="p-4 font-semibold text-center">Solved</th>
                      <th className="p-4 font-semibold text-center">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {results.map((r, i) => (
                      <tr key={r.participantId} className={`bg-slate-800/50 hover:bg-slate-700/30 transition ${r.isWinner ? 'bg-emerald-900/20' : ''}`}>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${r.rank === 1 ? 'bg-yellow-500 text-black' : r.rank === 2 ? 'bg-slate-300 text-black' : r.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                            {r.rank || '-'}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white flex items-center gap-2">
                          {r.displayName}
                          {r.isWinner && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Winner</span>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-mono ${r.solvedCount === r.totalProblems && r.totalProblems > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {r.solvedCount} / {r.totalProblems}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-400 font-mono">
                          {r.finishTimeSec ? `${Math.floor(r.finishTimeSec / 60)}m ${r.finishTimeSec % 60}s` : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-lg text-slate-300 mb-6 text-center">
                Winner: <span className="font-bold text-emerald-400">{winner?.displayName}</span>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-900/20"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <AlertTriangle size={32} />
              <h2 className="text-xl font-bold text-white">Leave Battle?</h2>
            </div>
            <p className="text-slate-300 mb-6 text-sm">
              Are you sure you want to exit the room? You will forfeit the match if it is currently active.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (socketRef.current) {
                    socketRef.current.emit("battle:quit", {}, () => {
                      navigate('/');
                    });
                  } else {
                    navigate('/');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition"
              >
                Exit Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Queue */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] items-center pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="px-6 py-2.5 bg-slate-800/90 backdrop-blur-md border border-slate-700 text-white text-sm font-medium rounded-full shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
            {n.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
