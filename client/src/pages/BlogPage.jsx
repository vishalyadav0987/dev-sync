import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { api } from "../lib/api";
import { getGuestId } from "../hooks/useGuestId";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [active, setActive] = useState(null); // currently open post + comments
  const [comment, setComment] = useState("");
  const guestId = getGuestId();

  const load = () => api.getBlogs().then((r) => setBlogs(r.blogs));

  useEffect(() => {
    load();
  }, []);

  const openPost = async (slug) => setActive(await api.getBlog(slug));

  const submitPost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await api.createBlog({ title, contentMd: content });
    setTitle("");
    setContent("");
    load();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !active) return;
    const c = await api.addComment(active.id, comment);
    setActive({ ...active, comments: [...active.comments, c] });
    setComment("");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_1.3fr]">
      {/* List + composer */}
      <div className="space-y-6">
        <form onSubmit={submitPost} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-300">Write a post</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown content…"
            rows={6}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
            Publish
          </button>
        </form>

        <ul className="space-y-2">
          {blogs.map((b) => (
            <li key={b.id}>
              <button
                onClick={() => openPost(b.slug)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-left hover:border-indigo-500/50"
              >
                <p className="font-semibold text-white">{b.title}</p>
                <p className="text-xs text-slate-500">
                  by {b.author.displayName === "Anonymous" ? `Guest-${b.author.id.slice(0, 6)}` : b.author.displayName}
                  {" · "}
                  {b._count.comments} comments
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Reader + comments */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        {!active ? (
          <p className="text-slate-500">Select a post to read.</p>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white">{active.title}</h1>
            <div className="prose prose-invert mt-3 max-w-none prose-sm">
              <ReactMarkdown>{active.contentMd}</ReactMarkdown>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-slate-300">Comments</h3>
            <ul className="mt-2 space-y-2">
              {active.comments.map((c) => (
                <li key={c.id} className="rounded-md bg-slate-950 p-2.5 text-sm text-slate-300">
                  <span className="mr-2 font-mono text-xs text-indigo-400">
                    {c.authorId === guestId ? "You" : `Guest-${c.authorId.slice(0, 6)}`}
                  </span>
                  {c.body}
                </li>
              ))}
            </ul>

            <form onSubmit={submitComment} className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment…"
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              />
              <button className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Reply
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
