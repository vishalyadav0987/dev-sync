import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { api, socket } from "../../lib/api";
import { getGuestId } from "../../hooks/useGuestId";
import { Heart, MessageCircle, Bookmark, Share2, ArrowLeft } from "lucide-react";

export default function ArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const currentGuestId = getGuestId();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBlog(slug);
        setArticle(data);
        if (data) {
          setComments(data.comments || []);
          setLikesCount(data._count?.likes || 0);
          setHasLiked(data.hasLiked || false);
          setHasSaved(data.hasSaved || false);
        }
      } catch (err) {
        console.error("Failed to load article:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!article) return;

    const handleNewComment = (comment) => {
      if (comment.blogId === article.id) {
        setComments(prev => [...prev, comment]);
      }
    };

    const handleLikeUpdate = (data) => {
      if (data.blogId === article.id) {
        setLikesCount(data.likesCount);
      }
    };

    socket.on("blog:new_comment", handleNewComment);
    socket.on("blog:like_update", handleLikeUpdate);

    return () => {
      socket.off("blog:new_comment", handleNewComment);
      socket.off("blog:like_update", handleLikeUpdate);
    };
  }, [article]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !article) return;
    try {
      await api.addComment(article.id, newComment);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const toggleLike = async () => {
    if (!article) return;
    try {
      if (hasLiked) {
        setHasLiked(false);
        setLikesCount(prev => prev - 1);
        await api.unlikeBlog(article.id);
      } else {
        setHasLiked(true);
        setLikesCount(prev => prev + 1);
        await api.likeBlog(article.id);
      }
    } catch (err) {
      console.error("Failed to toggle like", err);
      // Revert optimism
      setHasLiked(!hasLiked);
    }
  };

  const toggleSave = async () => {
    if (!article) return;
    try {
      if (hasSaved) {
        setHasSaved(false);
        await api.unsaveBlog(article.id);
      } else {
        setHasSaved(true);
        await api.saveBlog(article.id);
      }
    } catch (err) {
      console.error("Failed to toggle save", err);
      setHasSaved(!hasSaved);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: article.title,
        url: url
      }).catch(err => console.error("Error sharing", err));
    } else {
      setShowShare(!showShare);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-10 animate-pulse space-y-6 relative z-10">
      <div className="h-10 bg-slate-800/40 border border-slate-800/60 rounded-xl w-3/4"></div>
      <div className="h-6 bg-slate-800/40 border border-slate-800/60 rounded-xl w-1/4"></div>
      <div className="h-64 bg-slate-800/40 border border-slate-800/60 rounded-2xl w-full mt-10"></div>
    </div>
  );
  
  if (!article) return <div className="text-center py-20 text-2xl text-slate-300 relative z-10">Article not found</div>;

  const isAuthor = article.authorId === currentGuestId;

  return (
    <div className="max-w-3xl mx-auto space-y-8 relative z-10">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        {isAuthor && (
          <Link to={`/blog/editor/${article.slug}`} className="text-sm bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 px-4 py-2 rounded-full font-medium transition-colors backdrop-blur-sm">
            Edit Story
          </Link>
        )}
      </div>

      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
        {article.title}
      </h1>

      <div className="flex items-center gap-4 py-6 border-y border-slate-800/60">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
          {article.author?.displayName?.charAt(0) || "A"}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-slate-200">{article.author?.displayName || "Anonymous"}</span>
          <div className="text-sm text-slate-400 flex items-center gap-2">
            <span>{(() => {
              try {
                return formatDistanceToNow(new Date(article.createdAt)) + " ago";
              } catch (e) {
                return "Unknown";
              }
            })()}</span>
            <span>&middot;</span>
            <span>{Math.ceil((article.contentMd?.length || 0) / 800)} min read</span>
          </div>
        </div>
      </div>

      <div className="prose prose-lg prose-invert max-w-none prose-slate
        prose-headings:text-slate-200 prose-headings:font-bold
        prose-a:text-indigo-400 hover:prose-a:text-indigo-300
        prose-strong:text-slate-200 prose-strong:font-bold
        prose-code:text-indigo-300 prose-code:bg-slate-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
        prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-slate-800/60
        prose-blockquote:border-l-indigo-500 prose-blockquote:bg-slate-900/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-slate-300
        prose-img:rounded-xl prose-img:border prose-img:border-slate-800/60
      " dangerouslySetInnerHTML={{ __html: article.contentMd }} />

      {/* Action Bar */}
      <div className="flex items-center justify-between py-6 border-y border-slate-800/60 mt-12 bg-slate-900/30 px-6 rounded-2xl backdrop-blur-sm">
        <div className="flex gap-6">
          <button 
            onClick={toggleLike}
            className={`flex items-center gap-2 transition-colors ${hasLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
          >
            <Heart size={24} fill={hasLiked ? "currentColor" : "none"} className={hasLiked ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" : ""} /> 
            <span className="font-medium text-lg">{likesCount}</span>
          </button>
          <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 transition-colors">
            <MessageCircle size={24} /> <span className="font-medium text-lg">{comments.length}</span>
          </button>
        </div>
        <div className="flex gap-4 relative">
          <button 
            onClick={toggleSave}
            className={`transition-colors ${hasSaved ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
          >
            <Bookmark size={24} fill={hasSaved ? "currentColor" : "none"} className={hasSaved ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : ""} />
          </button>
          
          <button onClick={handleShare} className="text-slate-400 hover:text-indigo-400 transition-colors">
            <Share2 size={24} />
          </button>
          
          {showShare && (
            <div className="absolute right-0 top-10 bg-slate-900/95 border border-slate-700 shadow-2xl shadow-black rounded-xl p-4 w-64 z-50 backdrop-blur-md">
              <h4 className="font-bold mb-3 text-sm text-slate-200">Share this article</h4>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={window.location.href} 
                  className="flex-1 bg-slate-800 text-slate-300 text-xs p-2 rounded outline-none border border-slate-700"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowShare(false);
                    alert("Link copied!");
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <section className="pt-8">
        <h3 className="text-2xl font-bold mb-6 text-slate-100">Responses ({comments.length})</h3>
        
        <div className="bg-slate-900/40 rounded-2xl p-4 mb-8 border border-slate-800/60 backdrop-blur-sm focus-within:border-indigo-500/50 transition-colors">
          <textarea
            className="w-full bg-transparent border-none outline-none resize-none placeholder:text-slate-500 mb-4 text-slate-200"
            placeholder="What are your thoughts?"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
          <div className="flex justify-end">
            <button onClick={handlePostComment} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-2 rounded-full font-medium transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
              Respond
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {comments.map((comment, idx) => (
            <div key={comment.id || idx} className="flex gap-4">
               <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                {comment.author?.displayName?.charAt(0) || "A"}
              </div>
              <div className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200">{comment.author?.displayName || "Anonymous"}</span>
                  <span className="text-xs text-slate-500">{(() => {
                    try {
                      return formatDistanceToNow(new Date(comment.createdAt)) + " ago";
                    } catch (e) {
                      return "Unknown";
                    }
                  })()}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
