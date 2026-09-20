import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Hash, Code2, Globe } from "lucide-react";
import { api } from "../../lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ExploreProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popular tags mock for now
  const popularTags = ["React", "Node.js", "Fullstack", "Machine Learning", "Portfolio"];

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProjects();
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProjects = projects.filter(p => 
    p?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p?.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full relative z-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-slate-800/60 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Explore Projects</h1>
            <p className="text-slate-400 text-lg mt-1">Discover what the community is building.</p>
          </div>
        </div>
        
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search projects by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-slate-900/50 border border-slate-700/60 focus:border-indigo-500 focus:bg-slate-900/80 outline-none transition-colors text-lg text-slate-200 placeholder:text-slate-500 shadow-inner"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-800/40 rounded-3xl border border-slate-800/60 animate-pulse"></div>
            <div className="h-64 bg-slate-800/40 rounded-3xl border border-slate-800/60 animate-pulse"></div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              if (!project || !project.id) return null;
              let dateStr = "Unknown";
              try {
                if (project.publishedAt) {
                  dateStr = formatDistanceToNow(new Date(project.publishedAt)) + " ago";
                }
              } catch (e) {}

              return (
              <div key={project.id} className="group bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all flex flex-col gap-4 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                
                <div className="flex justify-between items-start">
                    <Link to={`/projects/${project.slug}`} className="block">
                        <h3 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {project.name || "Untitled"}
                        </h3>
                    </Link>
                    {project.coverImage && (
                         <img src={project.coverImage} alt={project.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700/50" />
                    )}
                </div>

                <p className="text-slate-400/80 text-sm line-clamp-2 leading-relaxed">
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
                    <span className="text-slate-600 mx-1">•</span>
                    <span className="text-slate-500">{dateStr}</span>
                  </div>

                  <div className="flex items-center gap-3">
                      {project.githubUrl && (
                          <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors" title="GitHub Repository">
                              <Code2 size={18} />
                          </a>
                      )}
                      {project.liveUrl && (
                          <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-400 transition-colors" title="Live Demo">
                              <Globe size={18} />
                          </a>
                      )}
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
