import { useCallback, useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { api, socket } from "../lib/api";
import SessionSidebar from "../components/Sessions/SessionSidebar";
import SessionCommandCenter from "../components/Sessions/SessionCommandCenter";
import SessionWorkspace from "../components/Sessions/SessionWorkspace";
import CreateSessionDrawer from "../components/Sessions/CreateSessionDrawer";
import ConfirmDialog from "../components/Sessions/ConfirmDialog";
import { isToday, isThisWeek } from "date-fns";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null); // non-null => workspace view
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { session, permanent } | null

  const loadSessions = useCallback(async () => {
    const list = await api.getSessions();
    setSessions(list);
    setLoaded(true);
    return list;
  }, []);

  const loadInsights = useCallback(async () => {
    try {
      const data = await api.getSessionInsights();
      setInsights(data);
    } catch {
      // Insights are a nice-to-have — never block the page on this failing.
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadInsights();
  }, [loadSessions, loadInsights]);

  // Real-time-ish sync: another tab/device touched a session -> refresh the list.
  useEffect(() => {
    const handler = () => {
      loadSessions();
      loadInsights();
    };
    socket.on("session:updated", handler);
    return () => socket.off("session:updated", handler);
  }, [loadSessions, loadInsights]);

  const topics = Array.from(new Set(sessions.map((s) => s.category).filter(Boolean)));

  const filtered = sessions
    .filter((s) => {
      const haystack = `${s.title} ${s.category || ""} ${s.goalLabel || ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .filter((s) => {
      if (filter === "all") return s.status !== "ARCHIVED";
      if (filter === "active") return s.status === "ACTIVE";
      if (filter === "completed") return s.status === "COMPLETED";
      if (filter === "archived") return s.status === "ARCHIVED";
      if (filter === "favorites") return s.isFavorite;
      return true;
    })
    .filter((s) => {
      if (!quickFilter) return true;
      if (quickFilter === "Today") return isToday(new Date(s.updatedAt));
      if (quickFilter === "This Week") return isThisWeek(new Date(s.updatedAt));
      return s.category === quickFilter;
    });

  const openWorkspace = (id) => {
    setWorkspaceId(id);
    setSidebarOpen(false);
  };

  const backToList = (openId) => {
    setWorkspaceId(openId || null);
    loadSessions();
    loadInsights();
  };

  const createSession = async (data) => {
    const created = await api.createSession(data);
    setShowCreate(false);
    await loadSessions();
    openWorkspace(created.id);
  };

  const toggleFavorite = async (session) => {
    await api.updateSession(session.id, { isFavorite: !session.isFavorite });
    loadSessions();
  };

  const duplicateSession = async (session) => {
    const copy = await api.duplicateSession(session.id, { copyNotes: false });
    await loadSessions();
    openWorkspace(copy.id);
  };

  const archiveSession = async (session) => {
    await api.archiveSession(session.id);
    loadSessions();
  };

  const restoreSession = async (session) => {
    await api.restoreSession(session.id);
    loadSessions();
  };

  const requestDelete = (session) => setConfirmDelete({ session });

  const confirmDeleteForever = async () => {
    if (!confirmDelete) return;
    await api.deleteSessionForever(confirmDelete.session.id);
    setConfirmDelete(null);
    loadSessions();
  };

  const handleRecommendationClick = (rec) => {
    if (rec.sessionId) openWorkspace(rec.sessionId);
  };

  const sidebarProps = {
    sessions: filtered,
    activeId: workspaceId,
    search,
    onSearch: setSearch,
    onSelect: openWorkspace,
    onCreate: () => setShowCreate(true),
    filter,
    onFilterChange: setFilter,
    quickFilter,
    onQuickFilterChange: setQuickFilter,
    topics,
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] grid gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      {/* Mobile header + sidebar toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <h1 className="text-lg font-bold text-white">Study Sessions</h1>
        {!workspaceId && (
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg border border-white/10 p-2 text-slate-300">
            <Menu className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sidebar — drawer on mobile, column on desktop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="h-full w-72 bg-slate-950 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">My Sessions</span>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <SessionSidebar {...sidebarProps} />
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Study Sessions</h1>
        </div>
        <SessionSidebar {...sidebarProps} />
      </div>

      <main className="flex min-h-[70vh] min-w-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        {!loaded ? (
          <div className="flex h-64 flex-1 items-center justify-center text-sm text-slate-500">Loading…</div>
        ) : workspaceId ? (
          <SessionWorkspace sessionId={workspaceId} onBack={backToList} onSessionChanged={loadSessions} />
        ) : (
          <SessionCommandCenter
            sessions={filtered}
            insights={insights}
            onOpen={openWorkspace}
            onToggleFavorite={toggleFavorite}
            onDuplicate={duplicateSession}
            onArchive={archiveSession}
            onRestore={restoreSession}
            onDelete={requestDelete}
            onCreate={() => setShowCreate(true)}
            onRecommendationClick={handleRecommendationClick}
          />
        )}
      </main>

      {showCreate && <CreateSessionDrawer onClose={() => setShowCreate(false)} onCreate={createSession} />}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={`Delete "${confirmDelete?.session?.title}" forever?`}
        description="This permanently removes the session and its problem queue. This can't be undone."
        confirmLabel="Delete Forever"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteForever}
      />
    </div>
  );
}
