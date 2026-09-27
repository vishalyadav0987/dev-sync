import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Globe, Code2, Calendar, BookOpen, User, Tag, Heart, Bookmark, Eye, MessageSquare, GitFork, GitBranch } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { api, socket, API_BASE_URL } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";
import ProjectComments from "./ProjectComments";

export default function ProjectDetails() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [interactions, setInteractions] = useState({ likes: 0, views: 0, saves: 0, isLiked: false, isSaved: false });
  const [githubConnected, setGithubConnected] = useState(false);
  const [forking, setForking] = useState(false);
  const hasViewed = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProject(slug);
        setProject(data.project);
        
        // Register view and fetch interactions
        if (!hasViewed.current) {
          hasViewed.current = true;
          api.viewProject(data.project.id).then(res => setInteractions(prev => ({ ...prev, views: res.views }))).catch(console.error);
        }
        
        const [interactionsRes, statsRes] = await Promise.all([
          api.getProjectInteractions(data.project.id).catch(() => null),
          api.getGuestStats().catch(() => ({}))
        ]);

        if (interactionsRes) {
          setInteractions(prev => ({
              ...prev,
              likes: interactionsRes.likesCount,
              saves: interactionsRes.savesCount,
              isLiked: interactionsRes.isLiked,
              isSaved: interactionsRes.isSaved,
          }));
        }

        setGithubConnected(statsRes.githubConnected || false);

      } catch (err) {
        setError("Failed to load project details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    const handleStatsUpdated = ({ projectId, updates }) => {
      if (project?.id === projectId) {
        setInteractions(prev => {
          const newInteractions = { ...prev };
          if (updates._count?.likes !== undefined) newInteractions.likes = updates._count.likes;
          if (updates.saves !== undefined) newInteractions.saves = updates.saves;
          if (updates.views !== undefined) newInteractions.views = updates.views;
          return newInteractions;
        });
        
        setProject(prev => {
          const newProject = { ...prev };
          if (updates.githubClicks !== undefined) newProject.githubClicks = updates.githubClicks;
          if (updates.liveClicks !== undefined) newProject.liveClicks = updates.liveClicks;
          return newProject;
        });
      }
    };
    
    const handleNewComment = ({ projectId, comment }) => {
      if (project?.id === projectId) {
        setComments(prev => [comment, ...prev]);
        setInteractions(prev => ({ ...prev, comments: (prev.comments || 0) + 1 }));
      }
    };

    socket.on("project:statsUpdated", handleStatsUpdated);
    socket.on("project:newComment", handleNewComment);
    return () => {
      socket.off("project:statsUpdated", handleStatsUpdated);
      socket.off("project:newComment", handleNewComment);
    };
  }, [project?.id]);

  const toggleLike = async () => {
    try {
        const res = await api.likeProject(project.id);
        setInteractions(prev => ({
            ...prev,
            isLiked: res.isLiked,
            likes: res.isLiked ? prev.likes + 1 : prev.likes - 1
        }));
    } catch(err) { console.error(err); }
  }

  const toggleSave = async () => {
    try {
        const res = await api.saveProject(project.id);
        setInteractions(prev => ({
            ...prev,
            isSaved: res.isSaved,
            saves: res.isSaved ? prev.saves + 1 : prev.saves - 1
        }));
    } catch(err) { console.error(err); }
  }

  const handleGithubClick = async () => {
    if (!project) return;
    try {
      api.clickProjectGithub(project.id).catch(console.error);
      setProject(prev => ({ ...prev, githubClicks: (prev.githubClicks || 0) + 1 }));
    } catch (e) {}
  };

  const handleLiveClick = async () => {
    if (!project) return;
    try {
      api.clickProjectLive(project.id).catch(console.error);
      setProject(prev => ({ ...prev, liveClicks: (prev.liveClicks || 0) + 1 }));
    } catch (e) {}
  };

  const handleConnectGithub = () => {
    const guestId = getGuestId();
    window.location.href = `${API_BASE_URL}/github/login?guestId=${guestId}`;
  };

  const handleFork = async () => {
    if (!githubConnected) {
      handleConnectGithub();
      return;
    }
    setForking(true);
    try {
      const res = await api.forkProject(project.id);
      if (res.forkUrl) {
        window.open(res.forkUrl, "_blank");
      } else {
        alert("Fork successful!");
      }
    } catch (err) {
      // Token expired — re-trigger GitHub OAuth
      if (err?.requireReauth) {
        setGithubConnected(false);
        handleConnectGithub();
        return;
      }
      alert(err.message || "Failed to fork project");
    } finally {
      setForking(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12">
        <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800/60 animate-pulse"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full relative z-10 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-300 mb-4">{error || "Project not found"}</h2>
        <Link to="/projects" className="text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Back to explore
        </Link>
      </div>
    );
  }

  const publishedDate = project.publishedAt 
    ? format(new Date(project.publishedAt), "MMM d, yyyy") 
    : "Unknown date";

  return (
    <div className="w-full max-w-6xl mx-auto relative z-10 pb-20 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 pb-8 mb-8 mt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 tracking-tight">
              {project.name}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700 text-slate-400 bg-slate-800/30 capitalize">
              {project.visibility?.toLowerCase() || "Public"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors cursor-default">
              <User size={16} className="text-slate-500" />
              <span className="font-medium text-slate-300">{project.owner?.displayName || "Anonymous"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-slate-500" />
              <span>{publishedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 shrink-0">
          
          <div className="flex items-center gap-4 text-slate-400 text-sm font-medium border-r border-slate-800 pr-4">
            <div className="flex items-center gap-1.5" title="Views">
              <Eye size={16} /> {interactions.views}
            </div>
            <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors ${interactions.isLiked ? "text-pink-500" : "hover:text-pink-400"}`}>
              <Heart size={16} className={interactions.isLiked ? "fill-current" : ""} /> {interactions.likes}
            </button>
            <button onClick={toggleSave} className={`flex items-center gap-1.5 transition-colors ${interactions.isSaved ? "text-yellow-500" : "hover:text-yellow-400"}`}>
              <Bookmark size={16} className={interactions.isSaved ? "fill-current" : ""} /> {interactions.saves}
            </button>
            {project.githubUrl && (
              <div className="flex items-center gap-1.5" title="GitHub Clicks">
                <Code2 size={16} /> {project.githubClicks || 0}
              </div>
            )}
            {project.liveUrl && (
              <div className="flex items-center gap-1.5" title="Live Demo Clicks">
                <Globe size={16} /> {project.liveClicks || 0}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
          {project.githubUrl && (
            <div className="flex rounded-md shadow-sm overflow-hidden border border-slate-700 h-[38px]">
              <a 
                href={project.githubUrl} 
                target="_blank" 
                rel="noreferrer"
                onClick={handleGithubClick}
                className="flex items-center justify-center gap-2 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-semibold transition-colors flex-1"
              >
                <Code2 size={16} />
                Code
              </a>
              <button
                onClick={handleFork}
                disabled={forking}
                className="flex items-center justify-center gap-1.5 px-3 bg-[#238636] hover:bg-[#2ea043] text-white border-l border-[#2ea043] text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                title={githubConnected ? "Fork Repository" : "Connect GitHub to Fork"}
              >
                <GitFork size={16} className={forking ? "animate-pulse" : ""} />
              </button>
            </div>
          )}
          {project.liveUrl && (
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noreferrer"
              onClick={handleLiveClick}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              <Globe size={16} />
              Live Demo
            </a>
          )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column - README & Image */}
        <div className="lg:col-span-3 space-y-6">
          {project.coverImage && (
            <div className="w-full rounded-xl border border-slate-800 overflow-hidden bg-slate-900 shadow-sm">
              <img 
                src={project.coverImage} 
                alt={`${project.name} cover`} 
                className="w-full max-h-[400px] object-cover"
              />
            </div>
          )}

          {/* GitHub-style README container */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117] shadow-sm">
            <div className="bg-[#161b22] px-5 py-3 border-b border-slate-800 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <BookOpen size={16} className="text-slate-500" />
              README.md
            </div>
            <div className="p-6 md:p-10">
              <div className="prose prose-invert prose-slate max-w-none prose-headings:border-b prose-headings:border-slate-800 prose-headings:pb-2 prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-slate-800 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {project.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
          
          <ProjectComments projectId={project.id} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">About</h3>
            <p className="text-sm text-slate-400 italic">
              {project.description?.substring(0, 100).replace(/[#*`_\[\]]/g, '')}...
            </p>
          </div>
          
          <div className="border-b border-slate-800 pb-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Tag size={16} /> Topics
            </h3>
            {project.tags && project.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, i) => (
                  <span key={i} className="text-xs font-medium px-2.5 py-1 bg-[#1f6feb]/10 text-[#58a6ff] hover:bg-[#1f6feb]/20 cursor-pointer rounded-full border border-transparent transition-colors">
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No topics provided.</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Resources</h3>
            <div className="flex flex-col gap-2">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" onClick={handleGithubClick} className="text-sm text-[#58a6ff] hover:underline flex items-center gap-2">
                  <BookOpen size={14} /> Repository
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" onClick={handleLiveClick} className="text-sm text-[#58a6ff] hover:underline flex items-center gap-2">
                  <Globe size={14} /> Official Website
                </a>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
