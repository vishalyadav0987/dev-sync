import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, Smile, Loader2, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useChat } from "./ChatContext";
import { api } from "../../lib/api"; // Assuming api is axios instance exported from api.js

export function MessageComposer() {
  const { sendMessage, sendTyping, replyingTo, setReplyingTo, messages } = useChat();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [errorMsg, setErrorMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Mentions state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionCursor, setMentionCursor] = useState(0);

  // Derived participants for mentions from messages
  const activeParticipants = Array.from(
    new Map(
      messages
        .filter((m) => m.participantId && m.displayName)
        .map((m) => [m.participantId, { id: m.participantId, name: m.displayName }])
    ).values()
  );
  
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifQuery, setGifQuery] = useState("");
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!text.trim() || isSending || isUploading) return;

    // Extract mentions by matching `@Name` in text against active participants
    const mentions = [];
    activeParticipants.forEach((p) => {
      if (text.includes(`@${p.name}`)) {
        mentions.push({ participantId: p.id });
      }
    });

    const payload = {
      type: "text",
      content: text.trim(),
      replyToId: replyingTo?.id || null,
      mentions: mentions.length > 0 ? mentions : undefined,
    };

    setIsSending(true);
    setErrorMsg(null);
    try {
      await sendMessage(payload);
      setText("");
      setReplyingTo(null);
      sendTyping(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to send");
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    sendTyping(val.length > 0);

    // Detect mention typing
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_ ]*)$/);

    if (match) {
      setShowMentions(true);
      setMentionFilter(match[1].toLowerCase());
      setMentionCursor(match.index);
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (participantName) => {
    const before = text.slice(0, mentionCursor);
    const after = text.slice(inputRef.current.selectionStart);
    setText(`${before}@${participantName} ${after}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const searchGifs = async (query) => {
    setIsSearchingGifs(true);
    try {
      const data = await api.searchChatGifs(query);
      setGifs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingGifs(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = "";

    // Convert to base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      setIsUploading(true);
      try {
        const data = await api.uploadChatMedia(base64);
        
        await sendMessage({
          type: "image",
          content: data.url, // backend returns the public URL
        });
      } catch (err) {
        console.error("Failed to upload image", err);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleGifSelect = async (url) => {
    setShowGifPicker(false);
    setIsSending(true);
    try {
      await sendMessage({
        type: "image", // Treat GIF as image for rendering
        content: url,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="border-t border-slate-700 bg-slate-800 p-3 shrink-0 relative">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="mb-2 bg-slate-900 border border-slate-700 rounded-lg p-2 flex items-center justify-between text-sm">
          <div className="flex flex-col overflow-hidden">
            <span className="text-indigo-400 font-medium text-xs">Replying to {replyingTo.displayName}</span>
            <span className="text-slate-300 truncate opacity-80">{replyingTo.content}</span>
          </div>
          <button type="button" onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-rose-400 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Mentions Dropdown */}
      {showMentions && activeParticipants.filter(p => p.name.toLowerCase().includes(mentionFilter)).length > 0 && (
        <div className="absolute bottom-full mb-2 left-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto z-30 py-1">
          {activeParticipants
            .filter((p) => p.name.toLowerCase().includes(mentionFilter))
            .map((p) => (
              <div
                key={p.id}
                className="px-3 py-2 text-sm text-slate-200 hover:bg-indigo-600 cursor-pointer"
                onClick={() => handleMentionSelect(p.name)}
              >
                @{p.name}
              </div>
            ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-3 z-30 shadow-xl">
          <EmojiPicker 
            theme="dark" 
            onEmojiClick={(emojiData) => {
              setText(prev => prev + emojiData.emoji);
              // Optionally close picker or keep it open
            }} 
          />
        </div>
      )}

      {/* GIF Picker Popover */}
      {showGifPicker && (
        <div className="absolute bottom-full mb-2 left-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-72 max-h-80 flex flex-col overflow-hidden z-20">
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              type="text"
              placeholder="Search GIFs..."
              value={gifQuery}
              onChange={(e) => {
                setGifQuery(e.target.value);
                searchGifs(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="p-2 overflow-y-auto flex-1 grid grid-cols-2 gap-2 custom-scrollbar">
            {isSearchingGifs ? (
              <div className="col-span-2 flex justify-center py-4 text-indigo-400">
                <Loader2 className="animate-spin" />
              </div>
            ) : gifs.length > 0 ? (
              gifs.map((gif) => (
                <img
                  key={gif.id}
                  src={gif.url}
                  alt="GIF"
                  onClick={() => handleGifSelect(gif.url)}
                  className="w-full h-24 object-cover rounded cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-4 text-slate-500 text-sm">
                No GIFs found
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {/* Emoji button */}
          <button 
            type="button" 
            onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
            className={`p-2 transition-colors ${showEmojiPicker ? "text-indigo-400" : "text-slate-400 hover:text-indigo-400"}`} 
            title="Add Emoji"
          >
            <Smile size={20} />
          </button>
          
          {/* GIF Button */}
          <button 
            type="button" 
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
              if (!showGifPicker && gifs.length === 0) searchGifs("trending");
            }}
            className={`p-1.5 text-xs font-bold border-2 rounded transition-colors ${showGifPicker ? "text-indigo-400 border-indigo-400" : "text-slate-400 border-slate-400 hover:text-indigo-400 hover:border-indigo-400"}`}
            title="Add GIF"
          >
            GIF
          </button>
          
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors relative"
            title="Upload Image"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
          </button>
        </div>
        
        <div className="relative flex items-end bg-slate-900 rounded-lg border border-slate-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleTextChange}
            onBlur={() => {
              sendTyping(false);
              // Delay hiding mentions so clicks can register
              setTimeout(() => setShowMentions(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message everyone..."
            className="w-full resize-none bg-transparent p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none max-h-32 min-h-[44px]"
            rows={1}
            style={{ height: "auto", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={!text.trim() || isSending || isUploading}
            className="p-3 text-indigo-500 disabled:text-slate-600 hover:text-indigo-400 transition-colors shrink-0"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
      {errorMsg && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-500/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
