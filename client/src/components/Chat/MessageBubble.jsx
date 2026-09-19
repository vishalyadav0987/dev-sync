import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "./ChatContext";
import { api, ASSET_BASE_URL } from "../../lib/api";
import { Reply, Smile, Flag } from "lucide-react";
import { BattleInviteCard } from "./BattleInviteCard";

const ALLOWED_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

export function MessageBubble({ message, showHeader }) {
  const { participant, setReplyingTo, messages, sendReaction } = useChat();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const isMine = participant && message.participantId === participant.participantId;
  const isMentioned = participant && message.type === "text" && message.content.includes(`@${participant.displayName}`);
  
  const repliedMessage = message.replyToId ? messages.find(m => m.id === message.replyToId) : null;

  // Extract all known names from messages to properly find multi-word mentions
  const activeNames = Array.from(new Set(messages.filter(m => m.displayName).map(m => m.displayName)));

  const renderContentWithMentions = (content) => {
    // Sort names by length descending so "Silent Panda" matches before "Silent"
    const sortedNames = activeNames.sort((a, b) => b.length - a.length);
    let rendered = [content];

    sortedNames.forEach(name => {
      const mentionStr = `@${name}`;
      rendered = rendered.flatMap((part, partIndex) => {
        if (typeof part !== "string") return [part]; // already a React element
        
        const split = part.split(mentionStr);
        if (split.length === 1) return [part]; // no match
        
        const result = [];
        split.forEach((s, idx) => {
          result.push(s);
          if (idx < split.length - 1) {
            const isMe = participant && name === participant.displayName;
            result.push(
              <span key={`${name}-${partIndex}-${idx}`} className={`inline-block font-semibold px-1.5 py-0.5 mx-0.5 rounded ${isMe ? "bg-amber-500/40 text-amber-100 ring-1 ring-amber-400" : "bg-indigo-500/40 text-indigo-100 ring-1 ring-indigo-400"}`}>
                {mentionStr}
              </span>
            );
          }
        });
        return result;
      });
    });

    return rendered;
  };

  const handleReport = async () => {
    if (window.confirm("Are you sure you want to report this message?")) {
      try {
        await api.reportChatMessage(message.id, participant?.participantId || "anonymous", "Inappropriate content");
        alert("Message reported successfully.");
      } catch (err) {
        alert("Failed to report message.");
      }
    }
  };

  return (
    <div className={`flex flex-col mb-1 px-4 ${isMine ? "items-end" : "items-start"}`}>
      {showHeader && !isMine && (
        <div className="flex items-center gap-2 mb-1 mt-3 ml-2">
          <span className="text-lg">{message.avatar}</span>
          <span className="text-xs font-semibold text-slate-400">{message.displayName}</span>
        </div>
      )}
      
      {showHeader && isMine && (
        <div className="mt-3" />
      )}

      {/* Render Reply Preview */}
      {message.replyToId && (
        <div className={`flex flex-col text-xs bg-slate-800/80 rounded-lg p-2 mb-1 max-w-[80%] border-l-2 border-slate-500 opacity-80 ${isMine ? "mr-4" : "ml-4"}`}>
          {repliedMessage ? (
            <>
              <span className="font-semibold text-slate-400 mb-0.5">{repliedMessage.displayName}</span>
              <span className="truncate">{repliedMessage.content}</span>
            </>
          ) : (
            <span className="italic text-slate-500">Message no longer available</span>
          )}
        </div>
      )}

      <div
        className={`group relative max-w-[85%] rounded-2xl px-4 py-2 ${
          isMentioned ? "ring-2 ring-amber-400 bg-amber-900/20" : ""
        } ${
          isMine
            ? "bg-indigo-600 text-indigo-50 rounded-tr-sm"
            : "bg-slate-700 text-slate-100 rounded-tl-sm"
        }`}
      >
        {message.type === "text" && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {renderContentWithMentions(message.content)}
          </p>
        )}
        
        {message.type === "image" && (
          <div className="max-w-full rounded-md overflow-hidden bg-slate-900/50 my-1">
            <img 
              src={message.content.startsWith('http') ? message.content : `${ASSET_BASE_URL}${message.content}`} 
              alt="Uploaded media"
              className="max-h-60 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.content.startsWith('http') ? message.content : `${ASSET_BASE_URL}${message.content}`, '_blank')}
            />
          </div>
        )}

        {message.type === "battle_invite" && (
          <BattleInviteCard invite={message.content} />
        )}

        <div
          className={`absolute bottom-1 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${
            isMine ? "right-full mr-2 text-slate-400" : "left-full ml-2 text-slate-400"
          } whitespace-nowrap`}
        >
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </div>

        {/* Action Bar (Hover or Long Press) */}
        <div className={`absolute top-0 -mt-3 ${isMine ? "left-0 -ml-12" : "right-0 -mr-12"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full p-1 shadow-lg z-10`}>
          <button 
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"
            title="React"
          >
            <Smile size={14} />
          </button>
          <button 
            onClick={() => setReplyingTo(message)}
            className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"
            title="Reply"
          >
            <Reply size={14} />
          </button>
          <button 
            onClick={handleReport}
            className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
            title="Report Message"
          >
            <Flag size={14} />
          </button>
        </div>

        {/* Reaction Picker Popover */}
        {showReactionPicker && (
          <div className={`absolute top-full mt-1 ${isMine ? "right-0" : "left-0"} bg-slate-800 border border-slate-700 rounded-full shadow-xl flex gap-1 p-1.5 z-20`}>
            {ALLOWED_REACTIONS.map(emoji => (
              <button 
                key={emoji}
                className="text-lg hover:scale-125 transition-transform"
                onClick={() => {
                  sendReaction(message.id, emoji);
                  setShowReactionPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Render Reactions */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`absolute -bottom-3 ${isMine ? "right-2" : "left-2"} flex gap-1 z-10`}>
            {Object.entries(message.reactions).map(([emoji, count]) => (
              <div key={emoji} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-1.5 py-0.5 text-[10px] text-slate-200 shadow-sm cursor-default">
                <span>{emoji}</span>
                {count > 1 && <span className="font-semibold">{count}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
