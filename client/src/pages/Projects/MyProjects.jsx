import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Code2, Globe, Edit2, Trash2, ExternalLink, Plus } from "lucide-react";
import { api } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";
import { format } from "date-fns";

export default function MyProjects() {
  const guestId = getGuestId();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!guestId) return;
      try {
        const data = await api.getProjects({ ownerId: guestId });
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load your projects.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [guestId]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete project");
    }
  };

  const drafts = projects.filter(p => p.visibility === "DRAFT");
  const published = projects.filter(p => p.visibility !== "DRAFT");

  const ProjectCard = ({ project }) => (
    <div className="group relative bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
        {/* Cover Image or Gradient Placeholder */}
        <div className="h-40 w-full relative overflow-hidden bg-slate-800">
            {project.coverImage ? (
                <img 
                    src={project.coverImage} 
                    alt={project.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <Code2 size={48} className="text-slate-700" />
                </div>
            )}
            {/* Badges Floating on Image */}
            <div className="absolute top-4 left-4 flex gap-2">
                {project.visibility !== "DRAFT" && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md ${project.visibility === 'PUBLIC' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                        {project.visibility}
                    </span>
                )}
                {project.visibility === "DRAFT" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md bg-slate-900/60 text-slate-300 border border-slate-700">
                        DRAFT
                    </span>
                )}
            </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1 gap-4">
            <div>
                <h3 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {project.name || "Untitled Project"}
                </h3>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                    {project.visibility === "DRAFT" ? (
                        <span>Last edited recently</span>
                    ) : (
                        <span>Published {format(new Date(project.publishedAt || project.createdAt), "MMM d, yyyy")}</span>
                    )}
                </div>
            </div>

            <p className="text-slate-400/80 text-sm line-clamp-3 flex-1">
                {project.description || "No description provided."}
            </p>

            {/* Tags (up to 3) */}
            {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {project.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded border border-slate-700/50">
                            {tag}
                        </span>
                    ))}
                    {project.tags.length > 3 && (
                        <span className="text-[10px] font-medium px-2 py-0.5 text-slate-500">
                            +{project.tags.length - 3}
                        </span>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
                {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="GitHub">
                        <Code2 size={14} />
                    </a>
                )}
                {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/50 transition-colors" title="Live Demo">
                        <Globe size={14} />
                    </a>
                )}
            </div>
            
            <div className="flex items-center gap-1.5">
                {project.visibility !== "DRAFT" && (
                    <Link to={`/projects/${project.slug}`} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-colors" title="View">
                        <ExternalLink size={14} />
                    </Link>
                )}
                <Link to={`/projects/edit/${project.slug}`} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-400 hover:bg-indigo-900/30 transition-colors" title="Edit">
                    <Edit2 size={14} />
                </Link>
                <button onClick={() => handleDelete(project.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-900/30 transition-colors" title="Delete">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto relative z-10 space-y-12 pb-20 animate-in fade-in duration-300 px-4 mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        <Link 
          to="/projects/publish" 
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
        >
          <Plus size={18} />
          New Project
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-12">
            <div>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    Drafts <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full">0</span>
                </h2>
                <div className="h-32 bg-slate-800/40 rounded-3xl border border-slate-800/60 animate-pulse"></div>
            </div>
        </div>
      ) : (
        <div className="space-y-12">
            
            {/* Drafts Section */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    Drafts 
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-mono">{drafts.length}</span>
                </h2>
                
                {drafts.length === 0 ? (
                    <div className="w-full p-12 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed text-center">
                        <p className="text-slate-500">You have no drafts. Start writing your next masterpiece.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {drafts.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </section>

            {/* Published Section */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    Published 
                    <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full font-mono">{published.length}</span>
                </h2>
                
                {published.length === 0 ? (
                    <div className="w-full p-12 bg-slate-900/20 rounded-3xl border border-slate-800 border-dashed text-center">
                        <p className="text-slate-500">You haven't published anything yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {published.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </section>

        </div>
      )}
    </div>
  );
}
