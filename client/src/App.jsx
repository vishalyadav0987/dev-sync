import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from "react-router-dom";
import Header from "./components/Header/Header";
import DSAPage from "./pages/DSAPage";
import SessionsPage from "./pages/SessionsPage";
import AdminPage from "./pages/AdminPage";
import VisualizePage from "./pages/VisualizePage";
import DynamicVisualizePage from "./pages/DynamicVisualizePage";

// Blog imports
import { seedDatabase } from "./lib/seed";
import BlogLayout from "./pages/Blog/BlogLayout";
import HomePage from "./pages/Blog/HomePage";
import ExplorePage from "./pages/Blog/ExplorePage";
import ArticlePage from "./pages/Blog/ArticlePage";
import DashboardPage from "./pages/Blog/DashboardPage";
import EditorPage from "./pages/Blog/EditorPage";
import SavedPage from "./pages/Blog/SavedPage";
import ProfilePage from "./pages/Blog/ProfilePage";
import BattlePage from "./pages/BattlePage";
import BattleLeaderboardPage from "./pages/BattleLeaderboardPage";
import BattleUserProfilePage from "./pages/BattleUserProfilePage";
import { ErrorBoundary } from "./components/ErrorBoundary";

// A wrapper to cleanly route to the correct visualization screen while keeping the same URL
function VisualizationRouteHandler() {
  const { slug } = useParams();

  if (slug.includes("n-queens")) {
    return <VisualizePage />;
  }

  return <DynamicVisualizePage />;
}

function MainLayout() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#030712] text-white flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col relative overflow-y-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

function FullScreenLayout() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[#030712] text-white flex flex-col">
      <Outlet />
    </div>
  );
}

import { ChatProvider, ChatLauncher, ChatDrawer } from "./components/Chat";
import { BattleCreateModal } from "./components/Battle/BattleCreateModal";

export default function App() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <ErrorBoundary>
      <ChatProvider>
        <BrowserRouter>
          <Routes>
            {/* Full Screen Routes */}
            <Route element={<FullScreenLayout />}>
              <Route path="/dsa/:slug/visualize" element={<VisualizationRouteHandler />} />
              <Route path="/battle/leaderboard" element={<BattleLeaderboardPage />} />
              <Route path="/battle/user/:guestId" element={<BattleUserProfilePage />} />
              <Route path="/battle/:roomId" element={<BattlePage />} />
            </Route>

            {/* Main Layout Routes (With Header) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dsa" replace />} />
              <Route path="/dsa" element={<DSAPage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/author-console" element={<AdminPage />} />
              <Route path="/battle/leaderboard" element={<BattleLeaderboardPage />} />

              {/* New Local-First Blog Platform Routes */}
              <Route path="/blog" element={<BlogLayout />}>
                <Route index element={<HomePage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="article/:slug" element={<ArticlePage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="editor/:slug?" element={<EditorPage />} />
                <Route path="saved" element={<SavedPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
          <ChatLauncher />
          <ChatDrawer />
          <BattleCreateModal />
        </BrowserRouter>
      </ChatProvider>
    </ErrorBoundary>
  );
}
