import { Outlet, Link, useLocation } from "react-router-dom";
import { PenSquare, Compass, Bookmark, LayoutDashboard, User } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const getLinkClasses = (path) => {
    // Only exact match for /blog, otherwise active if starts with path
    const isActive = path === "/blog" 
      ? location.pathname === "/blog" || location.pathname === "/blog/"
      : location.pathname.startsWith(path);
      
    return `group relative flex w-full items-center gap-3 rounded-lg py-2.5 px-4 text-left text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-indigo-500/10 text-indigo-300 shadow-[inset_2px_0_0_0_#6366f1]"
        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    }`;
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#030712] text-slate-200 selection:bg-indigo-500/30">
      {/* Mobile Navigation (Bottom) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-3 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <Link to="/blog" className="text-slate-400 hover:text-indigo-400"><Compass size={24} /></Link>
        <Link to="/blog/explore" className="text-slate-400 hover:text-indigo-400"><Compass size={24} /></Link>
        <Link to="/blog/editor" className="text-indigo-500"><PenSquare size={24} /></Link>
        <Link to="/blog/saved" className="text-slate-400 hover:text-indigo-400"><Bookmark size={24} /></Link>
        <Link to="/blog/profile" className="text-slate-400 hover:text-indigo-400"><User size={24} /></Link>
      </nav>

      {/* Desktop Navigation (Sidebar) */}
      <aside className="w-80 flex-shrink-0 bg-slate-900/40 border-r border-slate-800/60 backdrop-blur-2xl overflow-hidden hidden md:flex flex-col relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all">
        <div className="absolute top-0 left-0 right-0 h-40 bg-indigo-500/10 blur-[60px] rounded-full -translate-y-1/2 pointer-events-none" />
        
        <div className="p-6 pb-4 shrink-0 relative z-10 border-b border-white/5">
          <Link to="/blog" className="text-2xl font-black bg-gradient-to-br from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent tracking-tight block">
            Blogos
          </Link>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Developer Journal</p>
        </div>

        <div className="p-4 flex flex-col gap-1.5 flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent relative z-10">
          <Link to="/blog" className={getLinkClasses("/blog")}>
            <Compass size={18} className="shrink-0" />
            <span className="font-medium text-sm">Home</span>
          </Link>
          <Link to="/blog/explore" className={getLinkClasses("/blog/explore")}>
            <Compass size={18} className="shrink-0" />
            <span className="font-medium text-sm">Explore</span>
          </Link>
          <Link to="/blog/saved" className={getLinkClasses("/blog/saved")}>
            <Bookmark size={18} className="shrink-0" />
            <span className="font-medium text-sm">Saved</span>
          </Link>
          <Link to="/blog/dashboard" className={getLinkClasses("/blog/dashboard")}>
            <LayoutDashboard size={18} className="shrink-0" />
            <span className="font-medium text-sm">Dashboard</span>
          </Link>
        </div>

        <div className="mt-auto p-5 relative z-10 border-t border-white/5">
          <Link to="/blog/editor" className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 border border-indigo-500/50 font-bold hover:-translate-y-0.5 active:translate-y-0">
            <PenSquare size={18} />
            Write Article
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto relative scroll-smooth bg-gradient-to-br from-[#030712] to-[#0a0f1c]">
        {/* Ambient background glow for the main page */}
        <div className="fixed top-0 right-0 w-[600px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0" />
        
        <div className="flex-1 p-6 md:p-10 pb-24 md:pb-10 max-w-5xl mx-auto w-full relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
