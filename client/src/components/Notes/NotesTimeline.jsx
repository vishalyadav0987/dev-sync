import { Clock, Pin, Hash } from "lucide-react";

export default function NotesTimeline({ notes, currentStep }) {
  // Sort notes by stepId, keeping pinned notes at the top or interspersed based on stepId
  // Let's sort purely by stepId, treating null/undefined (general) as step 0
  const sortedNotes = [...notes].sort((a, b) => {
    const stepA = a.stepId ?? -1;
    const stepB = b.stepId ?? -1;
    return stepA - stepB;
  });

  return (
    <div className="h-full bg-slate-900 flex flex-col text-slate-300 w-full overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Clock size={16} className="text-yellow-400" />
          Notes Timeline
        </h3>
        <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{notes.length} total</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedNotes.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No notes yet. Create a note to attach it to a step!
          </div>
        ) : (
          <div className="space-y-4">
            {sortedNotes.map((note) => {
              const isActive = note.stepId === currentStep;
              
              let bgColor = "bg-slate-800 border-slate-700/50";
              let textColor = "text-slate-300";
              
              switch(note.color) {
                case "yellow": bgColor = "bg-yellow-900/20 border-yellow-700/50"; textColor = "text-yellow-200"; break;
                case "blue": bgColor = "bg-blue-900/20 border-blue-700/50"; textColor = "text-blue-200"; break;
                case "green": bgColor = "bg-green-900/20 border-green-700/50"; textColor = "text-green-200"; break;
                case "pink": bgColor = "bg-pink-900/20 border-pink-700/50"; textColor = "text-pink-200"; break;
                case "purple": bgColor = "bg-purple-900/20 border-purple-700/50"; textColor = "text-purple-200"; break;
                case "orange": bgColor = "bg-orange-900/20 border-orange-700/50"; textColor = "text-orange-200"; break;
              }

              return (
                <div key={note.id} className={`flex gap-3 relative ${isActive ? '' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                  {/* Step Marker */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 z-10 ${isActive ? 'bg-yellow-500 border-yellow-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      {note.stepId !== null ? note.stepId : <Pin size={12} />}
                    </div>
                    {/* Connecting line (optional, just css) */}
                    <div className="w-px h-full bg-slate-800 -my-1 absolute top-8 left-4 bottom-[-1rem]"></div>
                  </div>
                  
                  {/* Note Card */}
                  <div className={`flex-1 p-3 rounded shadow-lg border ${bgColor} ${isActive ? 'ring-1 ring-yellow-500' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`font-bold text-sm ${textColor} truncate`}>{note.title || "Untitled Note"}</h4>
                      {note.isPinned && <Pin size={12} className={textColor} />}
                    </div>
                    <div className="text-slate-400 text-xs line-clamp-3 whitespace-pre-wrap">
                      {note.content || "Empty note"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
