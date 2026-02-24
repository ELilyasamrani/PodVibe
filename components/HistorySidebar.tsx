import React, { useState } from 'react';
import { PodcastSession, PodcastSeries } from '../types';
import { History, PlayCircle, Trash2, Calendar, Plus, Library, FolderOpen, ChevronRight, Mic2 } from 'lucide-react';

interface HistorySidebarProps {
  history: PodcastSession[];
  series: PodcastSeries[];
  onSelect: (session: PodcastSession) => void;
  onSelectSeries: (series: PodcastSeries) => void;
  onDelete: (id: string) => void;
  onDeleteSeries: (id: string) => void;
  onNewSession: () => void;
  onNewSeries: () => void;
  currentId?: string;
  currentSeriesId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  series,
  onSelect,
  onSelectSeries,
  onDelete,
  onDeleteSeries,
  onNewSession,
  onNewSeries,
  currentId,
  currentSeriesId,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'recents' | 'programs'>('recents');

  const renderRecents = () => {
    if (history.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
            <History className="w-6 h-6 opacity-50" />
          </div>
          <p className="text-sm">No recent episodes</p>
          <button onClick={onNewSession} className="text-brand-400 text-xs hover:underline mt-2">Create one now</button>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {history.map((session) => {
          const isCurrent = currentId === session.id;
          return (
            <div
              key={session.id}
              onClick={() => onSelect(session)}
              className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all border overflow-hidden ${isCurrent
                ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-900/20'
                : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700'
                }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex-1 flex flex-col gap-1 transition-all duration-300 group-hover:translate-x-8 min-w-0">
                <h3 className={`text-sm font-medium truncate ${isCurrent ? 'text-brand-300' : 'text-slate-300 group-hover:text-white'}`}>
                  {session.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className={`transition-all duration-300 ${isCurrent ? 'opacity-100 group-hover:opacity-0' : 'opacity-0'} absolute right-0 top-1/2 -translate-y-1/2`}>
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                </div>
                <div className={`transition-all duration-300 ${isCurrent ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                  <PlayCircle className="w-5 h-5 text-brand-400 fill-brand-400/10" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPrograms = () => {
    if (series.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Library className="w-6 h-6 opacity-50" />
          </div>
          <p className="text-sm">No programs yet</p>
          <button onClick={onNewSeries} className="text-brand-400 text-xs hover:underline mt-2">Start a new series</button>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {series.map((s) => {
          const isCurrent = currentSeriesId === s.id;
          return (
            <div
              key={s.id}
              onClick={() => onSelectSeries(s)}
              className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all border overflow-hidden ${isCurrent
                ? 'bg-slate-800 border-brand-500/50 shadow-lg shadow-brand-900/20'
                : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-700'
                }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSeries(s.id);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex-1 flex flex-col gap-1 transition-all duration-300 group-hover:translate-x-8 min-w-0">
                <h3 className={`text-sm font-bold truncate ${isCurrent ? 'text-brand-300' : 'text-slate-200 group-hover:text-white'}`}>
                  {s.title}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <FolderOpen className="w-3 h-3" />
                  <span>{s.episodeIds.length} Episodes</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-[50] w-80 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col shrink-0 overflow-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-semibold px-1">
            <Library className="w-5 h-5 text-brand-500" />
            <span>Library</span>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-between gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-brand-500/10 group"
            >
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4" />
                <span>New Episode</span>
              </div>
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            </button>

            <button
              onClick={onNewSeries}
              className="w-full flex items-center justify-between gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-brand-400" />
                <span>New Program</span>
              </div>
              <Plus className="w-4 h-4 opacity-50" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('recents')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'recents' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Recents
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'programs' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Programs
            </button>
          </div>
        </div>

        {activeTab === 'recents' ? renderRecents() : renderPrograms()}
      </div>
    </>
  );
};

export default HistorySidebar;