import React from 'react';
import { PodcastSession } from '../types';
import { History, PlayCircle, Trash2, Calendar, Plus } from 'lucide-react';

interface HistorySidebarProps {
  history: PodcastSession[];
  onSelect: (session: PodcastSession) => void;
  onDelete: (id: string) => void;
  onNewSession: () => void;
  currentId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ history, onSelect, onDelete, onNewSession, currentId }) => {
  if (history.length === 0) {
    return (
      <div className="hidden lg:flex flex-col w-80 border-r border-slate-800 bg-slate-900/50 h-full overflow-hidden">
        <div className="p-4 border-b border-slate-800">
           <div className="flex items-center gap-2 text-slate-400 font-semibold mb-4">
            <History className="w-5 h-5" />
            <span>Your Library</span>
          </div>
          <button 
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/10"
          >
            <Plus className="w-5 h-5" />
            New Episode
          </button>
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
      <div className="p-4 border-b border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <History className="w-5 h-5 text-brand-500" />
          <span>Your Library</span>
        </div>
        <button 
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/10"
          >
            <Plus className="w-5 h-5" />
            New Episode
          </button>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {history.map((session) => {
          const isCurrent = currentId === session.id;
          
          return (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all border overflow-hidden ${
                isCurrent
                  ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-900/20'
                  : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              {/* Delete Action (Left) - appears on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Content Wrapper - slides right on hover */}
              <div className="flex-1 flex flex-col gap-1 transition-all duration-300 group-hover:translate-x-8 min-w-0">
                <h3 className={`text-sm font-medium truncate ${isCurrent ? 'text-brand-300' : 'text-slate-300 group-hover:text-white'}`}>
                  {session.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Right Action: Play Icon (Hover) or Active Indicator (Current) */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                 {/* Active Indicator (Pulse) - Fades out on hover if current */}
                 <div className={`transition-all duration-300 ${isCurrent ? 'opacity-100 group-hover:opacity-0' : 'opacity-0'} absolute right-0 top-1/2 -translate-y-1/2`}>
                    <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                 </div>
                 
                 {/* Play Icon - Slides in on hover */}
                 <div className={`transition-all duration-300 ${isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                    <PlayCircle className="w-5 h-5 text-brand-400 fill-brand-400/10" />
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySidebar;