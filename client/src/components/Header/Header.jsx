import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Sparkles, Home, Layers, BookOpen, Clock, Activity, CloudDownload, Loader2, X, Trophy } from "lucide-react";
import { api } from "../../lib/api";

function StreakBadge() {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    const fetchStreak = () => {
      api.getGuestStats().then((stats) => {
        setStreak({ count: stats.streak || 0, longest: stats.longestStreak || 0 });
      }).catch(() => {
        setStreak({ count: 0, longest: 0 });
      });
    };

    fetchStreak();

    // Refresh streak every minute to handle day changes while app is open
    const interval = setInterval(fetchStreak, 60000);

    // Also refresh when user switches back to this tab (e.g., waking computer next day)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStreak();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!streak) return null;

  const isOnFire = streak.count >= 3;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-slate-800 transition-colors cursor-default shadow-lg"
      title={`Longest streak: ${streak.longest} day(s)`}
    >
      <span aria-hidden className={isOnFire ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" : "text-amber-500"}>
        {isOnFire ? "🔥" : "🕯️"}
      </span>
      <span>{streak.count} day{streak.count === 1 ? "" : "s"}</span>
    </div>
  );
}

const navLinkClass = ({ isActive }) =>
  `relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-2 ${isActive
    ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
  }`;

export default function Header() {
  const [syncStatusData, setSyncStatusData] = useState({ status: "LOADING" });
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sessionCookie, setSessionCookie] = useState("");

  const fetchStatus = () => {
    api.getLeetCodeSyncStatus().then(setSyncStatusData).catch(console.error);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!sessionCookie.trim()) return;

    setSyncing(true);
    try {
      const res = await api.syncLeetCode(sessionCookie);
      alert(res.message || "Sync successful!");
      setShowModal(false);
      setSessionCookie("");
      fetchStatus();
      // Optional: don't reload, or reload if needed. The user wanted frontend to update automatically.
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to sync LeetCode. Please check the backend console for more details.");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusDisplay = () => {
    if (syncStatusData.status === "LOADING") return null;
    if (syncStatusData.status === "DISCONNECTED") return (
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full border border-slate-700/50">Disconnected</span>
    );
    if (syncStatusData.status === "SYNCING") return (
      <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
        <Loader2 className="w-3 h-3 animate-spin" /> Syncing
      </span>
    );
    if (syncStatusData.status === "EXPIRED") return (
      <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20" title="Session expired. Please reconnect.">Expired</span>
    );
    if (syncStatusData.status === "ERROR") return (
      <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20" title={syncStatusData.error}>Error</span>
    );

    // SUCCESS
    const timeAgo = syncStatusData.lastSync
      ? Math.round((Date.now() - new Date(syncStatusData.lastSync).getTime()) / 60000)
      : 0;

    return (
      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" title={`Last synced: ${new Date(syncStatusData.lastSync).toLocaleString()}`}>
        {timeAgo < 1 ? "Just now" : `${timeAgo}m ago`}
      </span>
    );
  };

  return (
    <>
      <header className="w-full relative z-50 py-3 px-6 bg-slate-900/40 border-b border-slate-800/60 backdrop-blur-2xl flex justify-center">
        <div className="w-full max-w-[1400px] flex items-center justify-between">

          {/* Brand / Logo */}
          <div className="flex items-center gap-1 group cursor-pointer w-48 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all group-hover:-translate-y-0.5">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-100 transition-colors">
              Dev<span className="text-indigo-400">Portfolio</span>
            </span>
          </div>

          {/* Central Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/dsa" className={navLinkClass}>
              <Layers className="w-4 h-4" />
              <span className="whitespace-nowrap">DSA Showcase</span>
            </NavLink>
            <NavLink to="/blog" className={navLinkClass}>
              <BookOpen className="w-4 h-4" />
              <span>Blog</span>
            </NavLink>
            <NavLink to="/sessions" className={navLinkClass}>
              <Clock className="w-4 h-4" />
              <span>Sessions</span>
            </NavLink>
            <NavLink to="/battle/leaderboard" className={navLinkClass}>
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Leaderboard</span>
            </NavLink>
            <NavLink to="/author-console" className={navLinkClass}>
              <Activity className="w-4 h-4" />
              <span>Admin</span>
            </NavLink>
          </nav>

          {/* Right side (Stats / Profile) */}
          <div className="flex items-center gap-3 w-84 shrink-0 justify-end">
            <div className="hidden md:flex items-center gap-2">
              {getStatusDisplay()}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 hover:text-indigo-200 transition-colors"
                title="Sync LeetCode Submissions"
              >
                <CloudDownload className="w-4 h-4" />
                <span>{syncStatusData.status === "DISCONNECTED" || syncStatusData.status === "EXPIRED" ? "Connect" : "Sync"}</span>
              </button>
            </div>
            <StreakBadge />
          </div>
        </div>
      </header>

      {showModal && (
        <SyncModal 
          onClose={() => setShowModal(false)} 
          syncStatusData={syncStatusData} 
          setSyncStatusData={setSyncStatusData}
          onManualSync={fetchStatus} 
        />
      )}
    </>
  );
}

function SyncModal({ onClose, syncStatusData, setSyncStatusData, onManualSync }) {
  const [activeTab, setActiveTab] = useState("extension");
  
  // Extension State
  const [extStatus, setExtStatus] = useState("loading"); // loading, connected, disconnected

  // Manual Cookie State
  const [sessionCookie, setSessionCookie] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Fetch Extension Status
  useEffect(() => {
    api.getExtensionStatus().then(res => {
      setExtStatus(res.connected ? "connected" : "disconnected");
    }).catch(() => setExtStatus("disconnected"));
  }, []);

  const handleManualSync = async () => {
    if (!sessionCookie.trim()) return;
    setSyncing(true);
    try {
      const res = await api.syncLeetCode(sessionCookie);
      alert(res.message || "Sync successful!");
      onClose();
      onManualSync();
      window.location.reload();
    } catch (err) {
      alert(err.message || "Failed to sync LeetCode.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50">
          <button 
            onClick={() => setActiveTab("extension")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "extension" ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-slate-400 hover:text-slate-200"}`}
          >
            Chrome Extension
          </button>
          <button 
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "manual" ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" : "text-slate-400 hover:text-slate-200"}`}
          >
            Manual (Legacy)
          </button>
        </div>

        <div className="p-6">
          {activeTab === "extension" && (
            <div className="space-y-5 animate-in slide-in-from-left-4 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Real-Time Sync</h3>
                  <p className="text-xs text-slate-400">Syncs instantly when you get "Accepted" on LeetCode.</p>
                </div>
              </div>

              {extStatus === "loading" ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
              ) : extStatus === "connected" ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                    <CloudDownload className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-emerald-400 font-bold">Extension Connected!</h4>
                  <p className="text-xs text-slate-400">Go solve a problem on LeetCode. It will sync automatically.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4 text-sm text-slate-300">
                    <ol className="list-decimal list-inside space-y-2 marker:text-indigo-400 marker:font-bold">
                      <li>Install the <strong>DevPortfolio Extension</strong> in Chrome.</li>
                      <li>Log into <strong>LeetCode</strong>.</li>
                      <li>The extension will automatically link your account and log you in here!</li>
                    </ol>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Or, manually login with your LeetCode username:</p>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="LeetCode Username"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        id="lc-login-input"
                      />
                      <button 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        onClick={async () => {
                          const input = document.getElementById('lc-login-input');
                          if (!input.value.trim()) return;
                          try {
                            const res = await fetch('http://localhost:4000/api/leetcode/extension/login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ leetcodeUsername: input.value.trim() })
                            });
                            const data = await res.json();
                            if (data.success && data.guestId) {
                              localStorage.setItem("dsa_guest_id", data.guestId);
                              window.location.reload();
                            }
                          } catch(err) {
                            alert("Login failed");
                          }
                        }}
                      >
                        Login
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "manual" && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
               <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <CloudDownload className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Manual Sync</h3>
                  <p className="text-xs text-slate-400">Polls every 15m via LEETCODE_SESSION cookie.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 text-sm text-slate-300">
                  Provide your <strong>LEETCODE_SESSION</strong> cookie to securely import your code.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Session Cookie</label>
                  <input
                    type="text"
                    value={sessionCookie}
                    onChange={(e) => setSessionCookie(e.target.value)}
                    placeholder="Paste LEETCODE_SESSION here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleManualSync}
                    disabled={!sessionCookie.trim() || syncing}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                    {syncing ? "Syncing..." : "Start Legacy Sync"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
