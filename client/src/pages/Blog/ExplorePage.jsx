import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Hash, Heart, MessageCircle } from "lucide-react";
import { api } from "../../lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popular tags mock
  const popularTags = ["React", "JavaScript", "System Design", "Algorithms", "Career"];

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

  const filteredArticles = articles.filter(a => 
    a?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a?.contentMd?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 relative z-10">
      {/* Search Header */}
      <div className="flex flex-col gap-6 border-b border-slate-800/60 pb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Explore</h1>
        
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Search articles, topics, or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-slate-900/50 border border-slate-700/60 focus:border-indigo-500 focus:bg-slate-900/80 outline-none transition-colors text-lg text-slate-200 placeholder:text-slate-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-400 font-medium mr-2">Popular topics:</span>
          {popularTags.map(tag => (
            <button key={tag} className="flex items-center gap-1.5 text-sm bg-slate-800/60 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-full transition-colors border border-slate-700 hover:border-slate-500">
              <Hash size={14} className="text-slate-500" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="h-40 bg-slate-800/40 rounded-3xl border border-slate-800/60 animate-pulse"></div>
            <div className="h-40 bg-slate-800/40 rounded-3xl border border-slate-800/60 animate-pulse"></div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-slate-500">No articles found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredArticles.map((article) => {
              if (!article || !article.id) return null;
              let dateStr = "Unknown";
              try {
                if (article.createdAt) {
                  dateStr = formatDistanceToNow(new Date(article.createdAt)) + " ago";
                }
              } catch (e) {}

              return (
              <Link to={`/blog/article/${article.slug}`} key={article.id} className="group bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6 shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 transition-all flex flex-col gap-3 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
                <h3 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                  {article.title || "Untitled"}
                </h3>
                <p className="text-slate-400/80 text-sm line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: article.contentMd?.substring(0, 150) }} />
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-800/60 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                      {article.author?.displayName?.charAt(0) || "A"}
                    </div>
                    <span className="font-medium text-slate-300">{article.author?.displayName || "Anonymous"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">{dateStr}</span>
                    <div className="flex gap-3 text-slate-500">
                      <span className="flex items-center gap-1"><Heart size={14} /> {article._count?.likes || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={14} /> {article._count?.comments || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
