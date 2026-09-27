import { useState, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { api, socket } from "../../lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ProjectComments({ projectId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProjectComments(projectId);
        setComments(data.comments);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  useEffect(() => {
    const handleNewComment = ({ projectId: pid, comment }) => {
      if (pid === projectId) {
        setComments((prev) => {
          if (prev.find(c => c.id === comment.id)) return prev;
          return [...prev, comment];
        });
      }
    };
    socket.on("project:newComment", handleNewComment);
    return () => socket.off("project:newComment", handleNewComment);
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const data = await api.addProjectComment(projectId, body);
      setComments((prev) => [...prev, data.comment]);
      setBody("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border border-slate-800 rounded-xl overflow-hidden bg-[#0d1117] shadow-sm">
      <div className="bg-[#161b22] px-5 py-4 border-b border-slate-800 flex items-center gap-2 font-semibold text-slate-300">
        <MessageSquare size={18} className="text-slate-400" />
        Comments ({comments.length})
      </div>

      <div className="p-5 md:p-8 space-y-6">
        {loading ? (
          <div className="text-center text-sm text-slate-500 py-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-8 italic border border-dashed border-slate-800 rounded-lg">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-400 font-bold uppercase">
                  {comment.author?.displayName?.charAt(0) || "?"}
                </div>
                <div className="flex-1 bg-slate-800/30 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-200 text-sm">
                      {comment.author?.displayName || "Anonymous"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-slate-800 flex gap-4">
          <div className="flex-1">
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave a comment..."
              className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-600"
              required
            />
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="self-end px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {submitting ? "Posting..." : (
              <>
                <Send size={16} /> Post
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
