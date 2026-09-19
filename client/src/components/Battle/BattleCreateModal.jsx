import React, { useState, useEffect } from 'react';
import { X, Swords, Users, Loader2, Search, ArrowRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, ASSET_BASE_URL } from '../../lib/api';
import { getGuestId } from '../../hooks/useGuestId';
import { io } from 'socket.io-client';

export function BattleCreateModal() {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [joinRoomId, setJoinRoomId] = useState('');
  const [problems, setProblems] = useState([]);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(30); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [problemError, setProblemError] = useState('');
  
  const [availableBattles, setAvailableBattles] = useState([]);
  const [loadingBattles, setLoadingBattles] = useState(false);

  const navigate = useNavigate();
  const uuid = getGuestId();

  useEffect(() => {
    if (tab !== 'join') return;

    let mounted = true;
    const battleSocket = io(`${ASSET_BASE_URL}/battle`, { transports: ['websocket', 'polling'] });

    const fetchWaiting = async () => {
      setLoadingBattles(true);
      try {
        const res = await api.getWaitingBattles();
        if (mounted && res.success) {
          setAvailableBattles(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load waiting battles", err);
      } finally {
        if (mounted) setLoadingBattles(false);
      }
    };

    fetchWaiting();

    battleSocket.on("battle:waiting-updated", () => {
      fetchWaiting();
    });

    return () => {
      mounted = false;
      battleSocket.disconnect();
    };
  }, [tab]);

  useEffect(() => {
    if (tab !== 'create') return;
    
    setLoadingProblems(true);
    setProblemError('');
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const params = { page, limit: 10 };
        if (searchQuery) params.search = searchQuery;
        if (difficultyFilter !== 'ALL') params.difficulty = difficultyFilter;

        const data = await api.getBattleProblems(params);
        if (data.success) {
          setProblems(data.data);
          setTotalPages(data.pagination.totalPages);
          if (data.data.length === 0) setProblemError("No problems found");
        } else {
          setProblemError(data.error || "Failed to load problems.");
        }
      } catch (err) {
        console.error("Failed to fetch battle problems", err);
        setProblemError(err.message || "Failed to connect to server.");
      } finally {
        setLoadingProblems(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [tab, searchQuery, difficultyFilter, page]);

  const handleCreate = async () => {
    if (selectedProblems.length === 0) {
      setError("Please select at least one problem");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (!uuid) {
        setError("You need to log in or have a valid guest session to create a battle.");
        setLoading(false);
        return;
      }

      console.log("Creating battle with:", { uuid, problemIds: selectedProblems.map(p => p.id), maxPlayers, durationMinutes });
      
      const data = await api.createBattle({
        uuid,
        problemIds: selectedProblems.map(p => p.id),
        maxPlayers,
        durationMinutes
      });
      
      document.getElementById('battle_create_modal').close();
      navigate(`/battle/${data.roomId}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!joinRoomId.trim()) {
      setError("Please enter a Room ID");
      return;
    }
    document.getElementById('battle_create_modal').close();
    navigate(`/battle/${joinRoomId.trim().toUpperCase()}`);
  };

  const closeAndClear = () => {
    const modal = document.getElementById('battle_create_modal');
    if (modal) modal.close();
    setError('');
  };

  return (
    <dialog id="battle_create_modal" className="modal bg-slate-950/80 backdrop-blur-md">
      <div className="modal-box bg-slate-900 border border-slate-800 shadow-[0_0_40px_rgba(79,70,229,0.1)] p-0 text-slate-200 max-w-xl overflow-hidden rounded-2xl relative">
        
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* HEADER */}
        <div className="relative p-6 pb-4 border-b border-slate-800/60 bg-gradient-to-b from-indigo-900/10 to-transparent">
          <button 
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-slate-400 hover:text-white" 
            onClick={closeAndClear}
          >
            <X size={20} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Swords size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-2xl text-white tracking-tight">DSA BATTLE</h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE BATTLE
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 font-medium">Create a real-time coding challenge</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* TABS */}
          <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setTab('create'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'create' 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/30' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Swords size={16} /> CREATE BATTLE
            </button>
            <button
              type="button"
              onClick={() => { setTab('join'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                tab === 'join' 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-400/30' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <ArrowRight size={16} /> JOIN BATTLE
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-start gap-2 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <span>{error}</span>
            </div>
          )}

          {/* CREATE TAB */}
          {tab === 'create' && (
            <div className="space-y-6">
              
              {/* CHALLENGE SELECTION (HERO) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-600"></span>
                  Choose Your Challenge
                  <span className="flex-1 h-[1px] bg-slate-800"></span>
                </h4>

                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search 1,500+ DSA problems..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    className="w-full bg-slate-950/50 border border-slate-700 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 block pl-10 p-3 shadow-inner transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Difficulty Pills */}
                <div className="flex flex-wrap gap-2">
                  {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => { setDifficultyFilter(diff); setPage(1); }}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all border ${
                        difficultyFilter === diff
                          ? 'bg-slate-700 text-white border-slate-500 shadow-md'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>

                {/* Problem List */}
                <div className="bg-slate-950/30 border border-slate-800 rounded-xl overflow-hidden relative">
                  {loadingProblems ? (
                    <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                      <Loader2 size={24} className="animate-spin mb-3 text-indigo-500" />
                      <span className="text-sm font-medium">Searching DSA problems...</span>
                    </div>
                  ) : problemError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-3 border border-rose-500/20">
                        <X size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">⚠ Unable to load challenges</span>
                      <span className="text-xs text-slate-500 mt-1">{problemError === "No problems found" ? "Try another title or difficulty." : problemError}</span>
                    </div>
                  ) : (
                    <div className="max-h-44 overflow-y-auto custom-scrollbar flex flex-col p-1.5 gap-1.5">
                      {problems.map(p => {
                        const isSelected = selectedProblems.some(sp => sp.id === p.id);
                        return (
                          <div 
                            key={p.id}
                            onClick={() => {
                              setProblemError('');
                              if (isSelected) {
                                setSelectedProblems(prev => prev.filter(sp => sp.id !== p.id));
                              } else {
                                if (selectedProblems.length >= 5) {
                                  setProblemError("Maximum 5 problems allowed.");
                                  return;
                                }
                                setSelectedProblems(prev => [...prev, p]);
                              }
                            }}
                            className={`group relative p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all duration-200 border ${
                              isSelected 
                                ? 'border-indigo-500 bg-indigo-900/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'border-slate-800/50 bg-slate-900 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className={`text-sm font-semibold transition-colors ${isSelected ? 'text-indigo-200' : 'text-slate-300 group-hover:text-white'}`}>
                                {isSelected && <Check size={14} className="inline mr-2 text-indigo-400" />}
                                {p.title}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] text-indigo-400/70 mt-1 font-bold tracking-wide">SELECTED</span>
                              )}
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase border ${
                              p.difficulty === 'EASY' ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20' :
                              p.difficulty === 'MEDIUM' ? 'text-amber-400 bg-amber-400/5 border-amber-400/20' :
                              'text-rose-400 bg-rose-400/5 border-rose-400/20'
                            }`}>
                              {p.difficulty}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination Footer */}
                  {!loadingProblems && problems.length > 0 && totalPages > 1 && (
                    <div className="flex justify-between items-center text-xs p-2 px-3 border-t border-slate-800 bg-slate-900/50">
                      <button 
                        type="button"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors font-medium disabled:opacity-50"
                      >
                        ← Prev
                      </button>
                      <span className="text-slate-500 font-medium">Page {page} of {totalPages}</span>
                      <button 
                        type="button"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* BATTLE SETTINGS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-600"></span>
                  Battle Settings
                  <span className="flex-1 h-[1px] bg-slate-800"></span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Players */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Max Players</label>
                    <div className="flex flex-wrap gap-2">
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMaxPlayers(num)}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all border ${
                            maxPlayers === num
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Duration</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "30 MIN", val: 30 },
                        { label: "1 HR", val: 60 },
                        { label: "1.5 HR", val: 90 },
                        { label: "2 HR", val: 120 }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setDurationMinutes(opt.val)}
                          className={`px-3 py-2 rounded-lg font-bold text-[11px] tracking-wider transition-all border ${
                            durationMinutes === opt.val
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BATTLE SUMMARY */}
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-inner">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Battle Summary</div>
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    {selectedProblems.length === 0 ? (
                      <span className="text-slate-400 font-medium italic">No challenge selected</span>
                    ) : (
                      <>
                        <span className="font-bold text-indigo-200 truncate max-w-[200px] sm:max-w-[250px]">
                          {selectedProblems.length === 1 ? selectedProblems[0].title : `Multiple Problems (${selectedProblems.length})`}
                        </span>
                        {selectedProblems.length === 1 && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            selectedProblems[0].difficulty === 'EASY' ? 'text-emerald-400 bg-emerald-400/10' :
                            selectedProblems[0].difficulty === 'MEDIUM' ? 'text-amber-400 bg-amber-400/10' :
                            'text-rose-400 bg-rose-400/10'
                          }`}>
                            {selectedProblems[0].difficulty}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-700 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                  <div className="flex items-center gap-1.5"><Users size={14} className="text-indigo-400"/> {maxPlayers} Players</div>
                  <div className="flex items-center gap-1.5 opacity-60">•</div>
                  <div className="flex items-center gap-1.5 text-indigo-300">{durationMinutes < 60 ? `${durationMinutes} Min` : `${durationMinutes / 60} Hr`}</div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-2 flex flex-col items-center">
                <button 
                  onClick={handleCreate}
                  disabled={loading || selectedProblems.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed border border-indigo-400/30"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Swords size={20} />}
                  {loading ? 'Creating Battle...' : 'Create Battle'}
                </button>
                <button 
                  onClick={closeAndClear} 
                  type="button"
                  className="mt-4 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>

            </div>
          )}

          {/* JOIN TAB */}
          {tab === 'join' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Enter Room ID</label>
                <div className="flex gap-3">
                  <input 
                    type="text"
                    placeholder="e.g. A1B2C3"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-950/50 border border-slate-700 text-white font-mono text-lg tracking-widest rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 block p-3 uppercase placeholder:text-slate-700 shadow-inner transition-all"
                    maxLength={6}
                  />
                  <button 
                    onClick={handleJoin}
                    disabled={!joinRoomId.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-400/30"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Available Battles Section */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <span className="w-4 h-[1px] bg-slate-600"></span>
                  Available Lobbies
                  <span className="flex-1 h-[1px] bg-slate-800"></span>
                  {loadingBattles && <Loader2 size={12} className="animate-spin text-purple-400" />}
                </h4>
                
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {!loadingBattles && availableBattles.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-950/30 rounded-xl border border-slate-800/50 border-dashed">
                      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-3">
                        <Users size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-300">No waiting battles</span>
                      <span className="text-xs text-slate-500 mt-1">Switch to Create tab to host one!</span>
                    </div>
                  )}
                  
                  {availableBattles.map(battle => {
                    return (
                      <div key={battle.roomId} className="group p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/30 hover:bg-slate-800/80 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden border border-slate-800 shadow-inner">
                            {battle.host?.avatar ? (
                              <img src={battle.host.avatar} alt="Host" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-200">{battle.host?.displayName || "Anonymous"}</div>
                            <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate max-w-[200px] flex items-center gap-1.5">
                              <span className="truncate">{battle.problem?.title || "Unknown Problem"}</span>
                              <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest border ${
                                battle.problem?.difficulty === 'EASY' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 
                                battle.problem?.difficulty === 'MEDIUM' ? 'text-amber-400 border-amber-400/20 bg-amber-400/5' : 
                                'text-rose-400 border-rose-400/20 bg-rose-400/5'
                              }`}>
                                {battle.problem?.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="text-[11px] font-bold bg-slate-950 px-2.5 py-1.5 rounded-lg text-slate-400 flex items-center gap-1.5 border border-slate-800 shadow-inner">
                            <Users size={12} className="text-purple-400"/>
                            {battle.currentPlayers} <span className="opacity-50">/</span> {battle.maxPlayers}
                          </div>
                          <button
                            onClick={() => {
                              document.getElementById('battle_create_modal').close();
                              navigate(`/battle/${battle.roomId}`);
                            }}
                            className="px-4 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-bold tracking-widest uppercase transition-all"
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Cancel link for Join tab too */}
              <div className="pt-4 flex justify-center">
                <button 
                  onClick={closeAndClear} 
                  type="button"
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
                >
                  Cancel
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-slate-950/80 backdrop-blur-sm">
        <button>close</button>
      </form>
    </dialog>
  );
}
