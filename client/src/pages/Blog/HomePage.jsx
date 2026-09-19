import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../lib/api";
import { Heart, MessageCircle, Bookmark, Share2, Sparkles } from "lucide-react";

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBlogs(1);
        setArticles(data.blogs || []);
      } catch (err) {
        console.error("Failed to load blogs", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-12 relative z-10">
      {/* Hero Section */}
      <section className="py-12 md:py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-indigo-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
          Ideas that matter.
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-10">
          A premium, local-first platform for readers and writers. Read, write, and explore without limits.
        </p>
        <div className="flex gap-4">
          <Link to="/blog/editor" className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25 border border-indigo-500/50">
            <Sparkles size={18} />
            Start Writing
          </Link>
          <Link to="/blog/explore" className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-8 py-3 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-sm border border-slate-700">
            Explore
          </Link>
        </div>
      </section>

      {/* Featured Articles Feed */}
      <section>
        <div className="flex justify-between items-center mb-8 border-b border-slate-800/60 pb-4">
          <h2 className="text-3xl font-bold tracking-tight text-white">Latest Reads</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-4 animate-pulse">
                <div className="bg-slate-800/50 rounded-2xl h-48 w-full border border-slate-800/60"></div>
                <div className="bg-slate-800/50 h-6 w-3/4 rounded"></div>
                <div className="bg-slate-800/50 h-4 w-full rounded"></div>
                <div className="bg-slate-800/50 h-4 w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => {
              if (!article || !article.id) return null;
              let dateStr = "Unknown";
              try {
                if (article.createdAt) {
                  dateStr = formatDistanceToNow(new Date(article.createdAt)) + " ago";
                }
              } catch (e) {}

              return (
              <Link to={`/blog/article/${article.slug}`} key={article.id} className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl hover:bg-slate-800/60 transition-colors">
                <div className="bg-slate-800/50 rounded-xl h-48 w-full flex items-center justify-center border border-slate-700/50 overflow-hidden px-4 text-center">
                  <span className="text-slate-500 font-medium text-lg">{article.title || "Untitled"}</span>
                </div>
                
                <div className="flex flex-col gap-2 flex-grow px-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                      {article.author?.displayName?.charAt(0) || "A"}
                    </div>
                    <span className="font-medium text-slate-300">{article.author?.displayName || "Anonymous"}</span>
                    <span>&middot;</span>
                    <span>{dateStr}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight text-slate-100">
                    {article.title || "Untitled"}
                  </h3>
                  
                  <p className="text-slate-400/80 line-clamp-2 text-sm" dangerouslySetInnerHTML={{ __html: article.contentMd?.substring(0, 150) }} />
                </div>
                
                <div className="flex items-center justify-between text-slate-500 mt-2 border-t border-slate-800/60 pt-4 px-1">
                  <div className="flex gap-4">
                    <span className={`flex items-center gap-1.5 text-sm ${article.hasLiked ? 'text-rose-400' : ''}`}>
                      <Heart size={16} fill={article.hasLiked ? "currentColor" : "none"} /> {article._count?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <MessageCircle size={16} /> {article._count?.comments || 0}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button><Bookmark size={18} /></button>
                    <button><Share2 size={18} /></button>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </section>
    </div>
  );
}
