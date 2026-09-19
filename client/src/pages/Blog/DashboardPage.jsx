import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";
import { PenSquare, Eye, Trash2 } from "lucide-react";

export default function DashboardPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBlogs(1, { drafts: true, authorId: getGuestId() });
        const blogs = data.blogs || [];
        blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setArticles(blogs);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await api.deleteBlog(id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const drafts = articles.filter(a => !a.published);
  const published = articles.filter(a => a.published);

  return (
    <div className="space-y-10 relative z-10">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
        <Link to="/blog/editor" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-2.5 rounded-full font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-indigo-500/25 border border-indigo-500/50 hover:-translate-y-0.5">
          <PenSquare size={18} /> New Story
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
          <div className="h-20 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-200">
              Drafts <span className="bg-slate-800 text-slate-400 text-xs py-1 px-3 rounded-full border border-slate-700">{drafts.length}</span>
            </h2>
            {drafts.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700/50">
                <p className="text-slate-500">You have no drafts. Start writing your next masterpiece.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drafts.map(article => (
                  <div key={article.id} className="group flex items-center justify-between p-4 border border-slate-800/60 rounded-2xl hover:border-indigo-500/50 transition-all bg-slate-900/40 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col">
                      <Link to={`/blog/editor/${article.slug}`} className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{article.title || "Untitled"}</Link>
                      <span className="text-sm text-slate-500 mt-1">Created {(() => {
                        try {
                          return formatDistanceToNow(new Date(article.createdAt)) + " ago";
                        } catch(e) {
                          return "Unknown";
                        }
                      })()}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/blog/editor/${article.slug}`} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><PenSquare size={20} /></Link>
                      <button onClick={() => handleDelete(article.id)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-200">
              Published <span className="bg-slate-800 text-slate-400 text-xs py-1 px-3 rounded-full border border-slate-700">{published.length}</span>
            </h2>
            {published.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700/50">
                <p className="text-slate-500">You haven't published anything yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {published.map(article => (
                  <div key={article.id} className="group flex items-center justify-between p-4 border border-slate-800/60 rounded-2xl hover:border-indigo-500/50 transition-all bg-slate-900/40 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col">
                      <Link to={`/blog/article/${article.slug}`} className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{article.title}</Link>
                      <span className="text-sm text-slate-500 mt-1">Published {(() => {
                        try {
                          return formatDistanceToNow(new Date(article.createdAt)) + " ago";
                        } catch(e) {
                          return "Unknown";
                        }
                      })()}</span>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/blog/article/${article.slug}`} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><Eye size={20} /></Link>
                      <Link to={`/blog/editor/${article.slug}`} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"><PenSquare size={20} /></Link>
                      <button onClick={() => handleDelete(article.id)} className="p-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
