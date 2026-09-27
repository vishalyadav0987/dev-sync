import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Code2, Globe, Edit2, Trash2, ExternalLink, Plus, Heart, MessageSquare, Eye, Tag } from "lucide-react";
import { api, socket } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";
import { formatDistanceToNow } from "date-fns";

export default function MyProjects() {
    const navigate = useNavigate();
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

    const ProjectCard = ({ project }) => {
        let dateStr = "Unknown";
        try {
            if (project.visibility !== "DRAFT" && project.publishedAt) {
                dateStr = formatDistanceToNow(new Date(project.publishedAt)) + " ago";
            } else if (project.createdAt) {
                dateStr = formatDistanceToNow(new Date(project.createdAt)) + " ago";
            }
        } catch (e) { }

        return (
            <div onClick={() => navigate(project.visibility === 'DRAFT' ? `/projects/edit/${project.slug}` : `/projects/${project.slug}`)} className="group relative bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col p-5 gap-4 backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />

                {/* Cover Image Placeholder with Title inside */}
                <div className="h-48 w-full bg-slate-800/50 rounded-2xl flex items-center justify-center p-6 text-center border border-slate-700/50 relative overflow-hidden group-hover:border-indigo-500/30 transition-colors">
                    {project.coverImage ? (
                        <img src={project.coverImage} className="w-full h-full object-cover absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity" alt={project.name} />
                    ) : (
                        <h2 className="text-xl font-bold text-slate-400/50 z-10 group-hover:text-indigo-400/50 transition-colors">{project.name || "Untitled Project"}</h2>
                    )}
                    {project.visibility === "DRAFT" && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-lg backdrop-blur-md bg-slate-900/80 text-slate-300 border border-slate-700 z-20">
                            DRAFT
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                        {project.owner?.displayName?.charAt(0) || "A"}
                    </div>
                    <span className="font-medium text-slate-300">{project.owner?.displayName || "Anonymous"}</span>
                    <span>•</span>
                    <span>{dateStr}</span>
                </div>

                <h3 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors line-clamp-2 relative z-10 pr-2">
                    {project.name || "Untitled Project"}
                </h3>

                <p className="text-slate-400/80 text-sm line-clamp-3 relative z-10 leading-relaxed">
                    {project.description || "No description provided."}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/60 text-slate-500 relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Views">
                            <Eye size={14} /> {project.views || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Likes">
                            <Heart size={14} className={project._count?.likes > 0 ? "text-pink-500 fill-pink-500/20" : ""} /> {project._count?.likes || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Comments">
                            <MessageSquare size={14} /> {project._count?.comments || 0}
                        </span>
                        {project.githubUrl && (
                            <span className="flex items-center gap-1 text-slate-500" title="GitHub Clicks">
                                <Code2 size={14} /> {project.githubClicks || 0}
                            </span>
                        )}
                        {project.liveUrl && (
                            <span className="flex items-center gap-1 text-slate-500" title="Live Demo Clicks">
                                <Globe size={14} /> {project.liveClicks || 0}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/edit/${project.slug}`); }} className="text-slate-400 hover:text-indigo-400 transition-colors" title="Edit">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }} className="text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
