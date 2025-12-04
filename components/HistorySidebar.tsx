import React from 'react';
import { PodcastSession } from '../types';
import { History, PlayCircle, Trash2, Calendar, FileText } from 'lucide-react';

interface HistorySidebarProps {
  history: PodcastSession[];
  onSelect: (session: PodcastSession) => void;
  onDelete: (id: string) => void;
  currentId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onDelete, currentId }) => {
  if (history.length === 0) {
    return (
      <div className="hidden lg:flex flex-col w-80 border-r border-slate-800 bg-slate-900/50 p-4 h-full">
        <div className="flex items-center gap-2 text-slate-400 mb-6 font-semibold">
          <History className="w-5 h-5" />
          <span>History</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
            <History className="w-6 h-6 opacity-50" />
          </div>
          <p className="text-sm">No podcasts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-80 border-r border-slate-800 bg-slate-900/50 h-full overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <History className="w-5 h-5 text-brand-500" />
          <span>Your Library</span>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {history.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session)}
            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
              currentId === session.id
                ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-900/20'
                : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700'
            }`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800/40 flex items-center justify-center">
              {session.audioBase64 ? (
                <PlayCircle className={`w-5 h-5 ${currentId === session.id ? 'text-brand-400' : 'text-slate-300'}`} />
              ) : (
                <FileText className={`w-5 h-5 ${currentId === session.id ? 'text-brand-400' : 'text-slate-300'}`} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <h3 className={`text-sm font-medium line-clamp-2 ${currentId === session.id ? 'text-brand-300' : 'text-slate-300 group-hover:text-white'}`}>
                  {session.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-opacity"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                {session.duration && (
                  <span className="ml-auto">{Math.floor((session.duration||0)/60)}:{String(Math.floor((session.duration||0)%60)).padStart(2,'0')}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySidebar;
