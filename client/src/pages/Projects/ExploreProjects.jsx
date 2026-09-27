import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Code2, Eye, Globe, Heart, MessageSquare, Search, Tag, User, Hash } from "lucide-react";
import { api, socket } from "../../lib/api";
import { formatDistanceToNow } from "date-fns";
import { GitFork, GitBranch } from "lucide-react";
import { API_BASE_URL } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";

export default function ExploreProjects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [forkingId, setForkingId] = useState(null);

  // Popular tags mock for now
  const popularTags = ["React", "Node.js", "Fullstack", "Machine Learning", "Portfolio"];

  useEffect(() => {
    async function load() {
      try {
        const [data, stats] = await Promise.all([
          api.getProjects(),
          api.getGuestStats().catch(() => ({}))
        ]);
        setProjects(data.projects || []);
        setGithubConnected(stats.githubConnected || false);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const handleStatsUpdated = ({ projectId, updates }) => {
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            ...updates,
            _count: {
              ...p._count,
              ...(updates._count || {})
            }
          };
        }
        return p;
      }));
    };

    socket.on("project:statsUpdated", handleStatsUpdated);
    return () => {
      socket.off("project:statsUpdated", handleStatsUpdated);
    };
  }, []);

  const filteredProjects = projects.filter(p =>
    p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGithubClick = async (e, project) => {
    e.stopPropagation();
    api.clickProjectGithub(project.id).catch(console.error);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, githubClicks: (p.githubClicks || 0) + 1 } : p));
    window.open(project.githubUrl, '_blank');
  };

  const handleLiveClick = (e, project) => {
    e.stopPropagation();
    api.clickProjectLive(project.id).catch(console.error);
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, liveClicks: (p.liveClicks || 0) + 1 } : p));
    window.open(project.liveUrl, '_blank');
  };

  const handleConnectGithub = () => {
    const guestId = getGuestId();
    window.location.href = `${API_BASE_URL}/github/login?guestId=${guestId}`;
  };

  const handleFork = async (e, project) => {
    e.stopPropagation();
    if (!githubConnected) {
      handleConnectGithub();
      return;
    }
    setForkingId(project.id);
    try {
      const res = await api.forkProject(project.id);
      if (res.success && res.project) {
        navigate(`/projects/${res.project.slug}`);
      }
    } catch (err) {
      if (err?.requireReauth) {
        setGithubConnected(false);
        handleConnectGithub();
        return;
      }
      console.error("Failed to fork project", err);
      alert(err.message || "Failed to fork project");
    } finally {
      setForkingId(null);
    }
  };

  return (
    <div className="w-full relative z-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-slate-800/60 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Explore Projects</h1>
            <p className="text-slate-400 text-lg mt-1">Discover what the community is building.</p>
          </div>
          {!githubConnected && (
            <button
              onClick={handleConnectGithub}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-200 font-medium transition-colors"
            >
              <GitBranch className="w-5 h-5" />
              Connect GitHub to Fork
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl pl-12 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-400 font-medium mr-2">Popular topics:</span>
          {popularTags.map(tag => (
            <button key={tag} onClick={() => setSearchQuery(tag)} className="flex items-center gap-1.5 text-sm bg-slate-800/60 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full transition-colors border border-slate-700 hover:border-slate-500">
              <Hash size={14} className="text-slate-500" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 flex flex-col gap-4 animate-pulse h-[200px]">
                <div className="h-8 bg-slate-800/60 rounded-lg w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-800/60 rounded w-full"></div>
                <div className="h-4 bg-slate-800/60 rounded w-5/6"></div>
                <div className="flex gap-2 mt-1">
                  <div className="h-6 bg-slate-800/60 rounded w-16"></div>
                  <div className="h-6 bg-slate-800/60 rounded w-20"></div>
                </div>
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-800/60"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-24"></div>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-slate-800/60 rounded w-16"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-12"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 rounded-3xl border border-slate-800/60 border-dashed backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700/50">
              <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">No projects found</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
              We couldn't find any projects matching "{searchQuery}". Try adjusting your search terms or exploring different tags.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProjects.map((project) => {
              if (!project || !project.id) return null;
              let dateStr = "Unknown";
              try {
                if (project.publishedAt) {
                  dateStr = formatDistanceToNow(new Date(project.publishedAt)) + " ago";
                }
              } catch (e) { }

              return (
                <div key={project.id} onClick={() => navigate(`/projects/${project.slug}`)} className="cursor-pointer group bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all flex flex-col gap-3 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                  <h3 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors pr-8">
                    {project.name || "Untitled"}
                  </h3>

                  <p className="text-slate-400/80 text-sm line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs font-medium px-2.5 py-1 bg-slate-800/80 text-slate-300 rounded-md border border-slate-700/50">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs font-medium px-2.5 py-1 bg-slate-800/50 text-slate-400 rounded-md">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/60 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                        {project.owner?.displayName?.charAt(0) || "A"}
                      </div>
                      <span className="font-medium text-slate-300">{project.owner?.displayName || "Anonymous"}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-slate-500">
                      <span>{dateStr}</span>

                      {project._count && (
                        <div className="flex gap-3 items-center">
                          <span className="flex items-center gap-1" title="Likes">
                            <Heart size={14} className={project._count.likes > 0 ? "text-pink-500 fill-pink-500/20" : ""} /> {project._count.likes}
                          </span>
                          <span className="flex items-center gap-1" title="Comments">
                            <MessageSquare size={14} /> {project._count.comments}
                          </span>
                          {project.githubUrl && (
                            <button
                              onClick={(e) => handleFork(e, project)}
                              disabled={forkingId === project.id}
                              className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                              title="Fork Project"
                            >
                              <GitFork size={14} className={forkingId === project.id ? "animate-pulse text-indigo-400" : ""} /> Fork
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 border-l border-slate-700 pl-4 ml-1">
                        {project.githubUrl && (
                          <button onClick={(e) => handleGithubClick(e, project)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors" title="GitHub Repository">
                            <Code2 size={16} /> <span className="text-xs">{project.githubClicks || 0}</span>
                          </button>
                        )}
                        {project.liveUrl && (
                          <button onClick={(e) => handleLiveClick(e, project)} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors" title="Live Demo">
                            <Globe size={16} /> <span className="text-xs">{project.liveClicks || 0}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
