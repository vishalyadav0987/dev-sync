import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../lib/api";
import { Bookmark, Eye } from "lucide-react";

export default function SavedPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSavedBlogs();
        setArticles(data.blogs || []);
      } catch (err) {
        console.error("Failed to load saved blogs", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUnsave = async (id) => {
    try {
      await api.unsaveBlog(id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to unsave", err);
    }
  };

  return (
    <div className="space-y-10 relative z-10">
      <div className="border-b border-slate-800/60 pb-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">Saved</h1>
        <p className="text-slate-400 text-lg mt-2">Your bookmarked articles.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
          <div className="h-20 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700/50">
              <p className="text-slate-500">You haven't saved any articles yet.</p>
            </div>
          ) : (
            articles.map(article => {
              if (!article || !article.id) return null;
              
              let dateStr = "Unknown";
              try {
                if (article.createdAt) {
                  dateStr = formatDistanceToNow(new Date(article.createdAt)) + " ago";
                }
              } catch (e) {
                console.error("Invalid date", article.createdAt);
              }
              
              return (
              <div key={article.id} className="flex items-center justify-between p-4 border border-slate-800/60 rounded-2xl hover:border-indigo-500/50 transition-all bg-slate-900/40 shadow-sm backdrop-blur-sm group">
                <div className="flex flex-col">
                  <Link to={`/blog/article/${article.slug}`} className="text-lg font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {article.title || "Untitled"}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="font-medium text-slate-400">{article.author?.displayName || "Anonymous"}</span>
                    <span>&middot;</span>
                    <span>Published {dateStr}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/blog/article/${article.slug}`} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <Eye size={20} />
                  </Link>
                  <button onClick={() => handleUnsave(article.id)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <Bookmark size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            )})
          )}
        </div>
      )}
    </div>
  );
}
