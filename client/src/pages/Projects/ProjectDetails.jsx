import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Globe, Code2, Calendar, BookOpen, User, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { api } from "../../lib/api";

export default function ProjectDetails() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProject(slug);
        setProject(data.project);
      } catch (err) {
        setError("Failed to load project details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

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

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          {project.githubUrl && (
            <a 
              href={project.githubUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              <Code2 size={16} />
              Code
            </a>
          )}
          {project.liveUrl && (
            <a 
              href={project.liveUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              <Globe size={16} />
              Live Demo
            </a>
          )}
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
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-sm text-[#58a6ff] hover:underline flex items-center gap-2">
                  <BookOpen size={14} /> Repository
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-sm text-[#58a6ff] hover:underline flex items-center gap-2">
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
