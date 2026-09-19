import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { api } from "../../lib/api";
import { Save, Image as ImageIcon, Link as LinkIcon, Send } from "lucide-react";

export default function EditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [articleId, setArticleId] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-lg prose-invert max-w-none focus:outline-none min-h-[500px]",
      },
    },
  });

  // Load existing article if editing
  useEffect(() => {
    async function load() {
      if (slug) {
        try {
          const article = await api.getBlog(slug);
          if (article) {
            setArticleId(article.id);
            setTitle(article.title);
            if (editor) {
              editor.commands.setContent(article.contentMd);
            }
          }
        } catch (e) {
          console.error("Failed to load blog", e);
        }
      }
    }
    if (editor) {
      load();
    }
  }, [slug, editor]);

  const saveArticle = useCallback(async (isPublish = false) => {
    if (!title.trim() && !editor?.getText().trim()) return;
    
    setIsSaving(true);
    try {
      const data = {
        title: title || "Untitled",
        contentMd: editor?.getHTML() || "",
        published: isPublish
      };

      let savedArticle;
      if (articleId) {
        savedArticle = await api.updateBlog(articleId, data);
        setLastSaved(new Date());
        
        if (isPublish) {
          navigate(`/blog/article/${savedArticle.slug}`);
        }
      } else {
        savedArticle = await api.createBlog(data);
        setArticleId(savedArticle.id);
        setLastSaved(new Date());
        
        if (isPublish) {
          navigate(`/blog/article/${savedArticle.slug}`);
        } else {
          // If it was a new draft, update URL to prevent duplicates
          navigate(`/blog/editor/${savedArticle.slug}`, { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [title, editor, articleId, navigate]);

  // Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || (editor && editor.getText().trim() !== "")) {
        saveArticle(false);
      }
    }, 5000); // Autosave after 5 seconds of inactivity
    
    return () => clearTimeout(timer);
  }, [title, editor?.getHTML(), saveArticle]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
      {/* Editor Toolbar Header */}
      <div className="flex items-center justify-between sticky top-0 bg-slate-900/70 backdrop-blur-xl py-4 z-40 border-b border-slate-800/60 shadow-2xl shadow-black/50 px-2 rounded-b-2xl">
        <div className="flex items-center gap-4 px-2">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-200 transition-colors font-medium">Cancel</button>
          <span className="text-sm font-medium text-slate-500 hidden sm:block">
            {isSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : "Draft"}
          </span>
        </div>
        
        <div className="flex items-center gap-3 px-2">
          <button 
            onClick={() => saveArticle(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700 hover:border-slate-500 shadow-sm"
          >
            <Save size={16} /> <span className="hidden sm:inline">Save Draft</span>
          </button>
          <button 
            onClick={() => saveArticle(true)}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-transform hover:-translate-y-0.5 active:scale-95 border border-indigo-500/50"
          >
            <Send size={16} /> Publish
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="pt-8 px-2 md:px-0">
        <input
          type="text"
          placeholder="Article Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-4xl md:text-5xl font-black bg-transparent border-none outline-none placeholder:text-slate-700 text-white mb-8"
        />
        
        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-6 p-2 rounded-2xl border border-slate-800/60 bg-slate-900/80 backdrop-blur-md shadow-xl sticky top-[80px] z-30">
           <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2.5 rounded-xl transition-colors ${editor.isActive('bold') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><strong>B</strong></button>
           <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2.5 rounded-xl transition-colors ${editor.isActive('italic') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><em>I</em></button>
           <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2.5 rounded-xl transition-colors font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>H2</button>
           <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2.5 rounded-xl transition-colors font-bold ${editor.isActive('blockquote') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>&quot;</button>
           <div className="w-px h-6 bg-slate-800 mx-2"></div>
           <button onClick={() => {
             const url = window.prompt('URL');
             if (url) editor.chain().focus().setLink({ href: url }).run();
           }} className="p-2.5 rounded-xl transition-colors text-slate-400 hover:bg-slate-800 hover:text-slate-200"><LinkIcon size={18} /></button>
           <button onClick={() => {
             const url = window.prompt('Image URL');
             if (url) editor.chain().focus().setImage({ src: url }).run();
           }} className="p-2.5 rounded-xl transition-colors text-slate-400 hover:bg-slate-800 hover:text-slate-200"><ImageIcon size={18} /></button>
        </div>

        <div className="prose-wrapper cursor-text bg-slate-900/20 border border-slate-800/40 rounded-3xl p-6 md:p-10 shadow-inner" onClick={() => editor.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
