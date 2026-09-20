import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { X, Image as ImageIcon, XCircle, ArrowLeft, Edit2, Eye, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { api } from "../../lib/api";

export default function PublishProject() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!slug);
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    githubUrl: "",
    liveUrl: "",
    coverImage: "",
    visibility: "PUBLIC",
  });
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState("write"); // 'write' or 'preview'

  useEffect(() => {
    if (slug) {
      const fetchProject = async () => {
        try {
          const res = await api.getProject(slug);
          if (res && res.project) {
            const p = res.project;
            setProjectId(p.id);
            setFormData({
              name: p.name || "",
              description: p.description || "",
              githubUrl: p.githubUrl || "",
              liveUrl: p.liveUrl || "",
              coverImage: p.coverImage || "",
              visibility: p.visibility || "PUBLIC",
            });
            setTags(p.tags || []);
          }
        } catch (err) {
          setError("Failed to load project details");
        } finally {
          setFetching(false);
        }
      };
      fetchProject();
    }
  }, [slug]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val) && tags.length < 10) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e, forceVisibility = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const submissionVisibility = forceVisibility || formData.visibility;

    try {
      if (submissionVisibility !== "DRAFT") {
        if (formData.name.length < 3) throw new Error("Project name must be at least 3 characters");
        if (formData.description.length < 10) throw new Error("Description must be at least 10 characters");
      }

      const payload = {
        ...formData,
        visibility: submissionVisibility,
        tags: tags,
        githubUrl: formData.githubUrl || undefined,
        liveUrl: formData.liveUrl || undefined,
        coverImage: formData.coverImage || undefined,
      };

      let res;
      if (projectId) {
        res = await api.updateProject(projectId, payload);
      } else {
        res = await api.createProject(payload);
      }
      
      if (res && res.project) {
        if (submissionVisibility === "DRAFT") {
          navigate("/projects/my-projects");
        } else {
          navigate(`/projects/${res.project.slug}`);
        }
      }
    } catch (err) {
      console.error("Project submission error:", err);
      // api.js might not expose the full response, but let's try.
      setError(err.message || "Failed to publish project");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="w-full relative z-10 space-y-8 animate-in fade-in duration-300 pb-12">
      <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors font-medium">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            {slug ? "Edit Project" : "Publish a Project"}
          </h1>
          <p className="text-slate-400 text-lg mt-1">Share your work with the community.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, "DRAFT")}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            Save Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, formData.visibility === "DRAFT" ? "PUBLIC" : formData.visibility)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Saving..." : slug ? "Update Project" : "Publish Project"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 font-medium flex items-center gap-2">
          <XCircle size={18} />
          {error}
        </div>
      )}

      <form id="publish-form" onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl space-y-8">
          
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Project Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Code Analyzer"
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700/60 rounded-xl focus:border-indigo-500 focus:bg-slate-900/80 outline-none text-slate-200 transition-colors text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Cover Image URL (Optional)</label>
            <input
              type="url"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/60 rounded-xl focus:border-indigo-500 focus:bg-slate-900/80 outline-none text-slate-200 transition-colors mb-3 text-sm"
            />
            {formData.coverImage ? (
              <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden border border-slate-700/60 relative group bg-slate-950/30">
                <img src={formData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
              </div>
            ) : (
              <div className="w-full max-w-2xl aspect-video rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 bg-slate-950/30">
                <ImageIcon size={24} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">16:9 Image Preview</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Links</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="GitHub Repository URL"
                className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/60 rounded-xl focus:border-indigo-500 focus:bg-slate-900/80 outline-none text-slate-200 transition-colors text-sm"
              />
              <input
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="Live Demo URL"
                className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/60 rounded-xl focus:border-indigo-500 focus:bg-slate-900/80 outline-none text-slate-200 transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Tags</label>
            <div className="w-full min-h-[48px] p-2 bg-slate-950/50 border border-slate-700/60 rounded-xl focus-within:border-indigo-500 focus-within:bg-slate-900/80 transition-colors flex flex-wrap items-center gap-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-md text-sm font-medium border border-indigo-500/20">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? "e.g. React, Node.js" : ""}
                className="flex-1 bg-transparent border-none outline-none text-slate-200 text-sm min-w-[120px] px-2 py-1"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Press Enter to add tags (max 10).</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-300">Description (Readme) <span className="text-red-400">*</span></label>
              <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "write" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Edit2 size={14} /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "preview" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Eye size={14} /> Preview
                </button>
              </div>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-700/60 rounded-xl overflow-hidden min-h-[400px] flex flex-col focus-within:border-indigo-500 focus-within:bg-slate-900/80 transition-colors">
              {activeTab === "write" ? (
                <textarea
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Markdown supported. Write a detailed description of your project..."
                  className="w-full flex-1 p-4 bg-transparent outline-none text-slate-200 resize-y min-h-[400px] font-mono text-sm leading-relaxed"
                />
              ) : (
                <div className="w-full flex-1 p-6 bg-slate-900/80 text-slate-200 overflow-y-auto prose prose-invert prose-indigo max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800/60 min-h-[400px]">
                  {formData.description.trim() ? (
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{formData.description || "*No description provided.*"}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-500 italic">Nothing to preview yet.</p>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Styling with Markdown is supported.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Visibility</label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700/60 rounded-xl focus:border-indigo-500 focus:bg-slate-900/80 outline-none text-slate-200 transition-colors appearance-none cursor-pointer text-sm font-medium"
            >
              <option value="PUBLIC">Public (Visible in Explore)</option>
              <option value="UNLISTED">Unlisted (Hidden from Explore)</option>
            </select>
          </div>

        </div>
      </form>
    </div>
  );
}
