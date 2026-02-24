
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PodcastSession, GenerationState, PodcastLength, PodcastLanguage, PodcastOptions, PodcastSeries } from './types';
import { generatePodcastScript, generatePodcastAudio, estimateTimestamps } from './services/geminiService';
import { decodeAudioData, createWavBlob } from './utils/audioUtils';
import HistorySidebar from './components/HistorySidebar';
import Player from './components/Player';
import Transcript from './components/Transcript';
import LandingPage from './components/LandingPage';
import ApiDocs from './components/ApiDocs';
import Footer from './components/Footer';
import { Headphones, Sparkles, MessageSquare, Menu, X, Clock, Globe, ChevronDown, Check, Settings, Mic2, FileText, User, Music, Link, Zap, Code, Image as ImageIcon, Upload, BookOpen, Plus, FolderPlus, Library, PlayCircle, FolderInput, FolderX, Info, Copy, RefreshCw, PenTool } from 'lucide-react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon: React.ReactNode;
  label?: string;
  placeholder?: string;
  className?: string;
}

const CustomDropdown: React.FC<DropdownProps> = ({ value, onChange, options, icon, label, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder || value;

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-semibold text-slate-400 mb-1 block">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all border outline-none text-left ${isOpen ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm truncate">{selectedLabel}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/5">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${value === option.value
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>{option.label}</span>
                {value === option.value && <Check className="w-4 h-4 text-brand-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VOICE_OPTIONS = [
  { label: 'Puck (Male)', value: 'Puck' },
  { label: 'Charon (Male - Deep)', value: 'Charon' },
  { label: 'Fenrir (Male - Deep)', value: 'Fenrir' },
  { label: 'Kore (Female)', value: 'Kore' },
  { label: 'Zephyr (Female)', value: 'Zephyr' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'app' | 'api-docs'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('auto') === 'true' ? 'app' : 'landing';
  });

  const [history, setHistory] = useState<PodcastSession[]>([]);
  const [series, setSeries] = useState<PodcastSeries[]>([]);

  const [currentSession, setCurrentSession] = useState<PodcastSession | null>(null);
  const [currentSeries, setCurrentSeries] = useState<PodcastSeries | null>(null);
  const [currentAudio, setCurrentAudio] = useState<Int16Array | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionViewTab, setSessionViewTab] = useState<'transcript' | 'details'>('transcript');

  // Program Creator Modal State
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [newSeriesData, setNewSeriesData] = useState({ title: '', description: '', coverImage: '' });

  // Options
  const [length, setLength] = useState<PodcastLength>('Medium');
  const [language, setLanguage] = useState<PodcastLanguage>('English');

  // Customization
  const [showSettings, setShowSettings] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [host1, setHost1] = useState('');
  const [host2, setHost2] = useState('');
  const [host1Role, setHost1Role] = useState('');
  const [host2Role, setHost2Role] = useState('');
  const [host1Description, setHost1Description] = useState('');
  const [host2Description, setHost2Description] = useState('');
  const [host1Voice, setHost1Voice] = useState('');
  const [host2Voice, setHost2Voice] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    const savedHistory = localStorage.getItem('podcast_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    const savedSeries = localStorage.getItem('podcast_series');
    if (savedSeries) {
      try { setSeries(JSON.parse(savedSeries)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('podcast_history', JSON.stringify(history));
    localStorage.setItem('podcast_series', JSON.stringify(series));
  }, [history, series]);

  const processGeneration = useCallback(async (params: {
    text: string;
    length: PodcastLength;
    language: PodcastLanguage;
    options: PodcastOptions;
    seriesId?: string;
    webhookUrl?: string;
  }) => {
    setGenerationState({ status: 'generating_script' });
    setCurrentAudio(null);
    setCurrentTime(0);
    setWebhookStatus('idle');

    try {
      const { title, summary, script, lines, usedHost1, usedHost2, prompt } = await generatePodcastScript(
        params.text,
        params.length,
        params.language,
        params.options
      );

      const newSession: PodcastSession = {
        id: Date.now().toString(),
        seriesId: params.seriesId,
        title,
        originalText: params.text,
        script,
        scriptLines: lines,
        createdAt: Date.now(),
        length: params.length,
        language: params.language,
        summary,
        customTitle: params.options.customTitle,
        customInstructions: params.options.customInstructions,
        host1: usedHost1,
        host2: usedHost2,
        host1Role: params.options.host1Role,
        host2Role: params.options.host2Role,
        host1Description: params.options.host1Description,
        host2Description: params.options.host2Description,
        host1Voice: params.options.host1Voice,
        host2Voice: params.options.host2Voice,
        coverImage: params.options.coverImage,
        fullPrompt: prompt
      };

      setCurrentSession(newSession);
      setHistory(prev => [newSession, ...prev]);

      if (params.seriesId) {
        setSeries(prev => prev.map(s => s.id === params.seriesId ? { ...s, episodeIds: [...s.episodeIds, newSession.id] } : s));
      }

      setGenerationState({ status: 'generating_audio' });
      const audioData = await generatePodcastAudio(
        lines,
        params.language,
        { host1: usedHost1, host2: usedHost2 },
        { host1Voice: params.options.host1Voice, host2Voice: params.options.host2Voice }
      );

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(new Uint8Array(audioData.buffer), audioCtx);
      const linesWithTimestamps = estimateTimestamps(lines, buffer.duration);

      const finalSession = {
        ...newSession,
        duration: buffer.duration,
        scriptLines: linesWithTimestamps
      };

      setCurrentSession(finalSession);
      setHistory(prev => [finalSession, ...prev.filter(p => p.id !== finalSession.id)]);
      setCurrentAudio(audioData);
      setGenerationState({ status: 'complete' });

      if (params.webhookUrl) {
        setWebhookStatus('sending');
        try {
          const wavBlob = createWavBlob(audioData);
          const reader = new FileReader();
          reader.readAsDataURL(wavBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            await fetch(params.webhookUrl!, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: finalSession.title,
                summary: finalSession.summary,
                script: finalSession.script,
                duration: finalSession.duration,
                audioBase64: base64Audio
              })
            });
            setWebhookStatus('sent');
          };
        } catch (err) {
          console.error(err);
          setWebhookStatus('error');
        }
      }

    } catch (error: any) {
      setGenerationState({ status: 'error', error: error.message || "Failed to generate podcast." });
    }
  }, []);

  const onGenerateClick = () => {
    if (!inputValue.trim()) return;
    processGeneration({
      text: inputValue,
      length,
      language,
      seriesId: currentSeries?.id,
      options: {
        customTitle: customTitle.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
        host1: host1.trim() || undefined,
        host2: host2.trim() || undefined,
        host1Role: host1Role.trim() || undefined,
        host2Role: host2Role.trim() || undefined,
        host1Description: host1Description.trim() || undefined,
        host2Description: host2Description.trim() || undefined,
        host1Voice: host1Voice || undefined,
        host2Voice: host2Voice || undefined,
        coverImage: coverImage,
        seriesContext: currentSeries?.description
      }
    });
    setInputValue('');
    setShowSettings(false);
  };

  const useAsTemplate = (session: PodcastSession) => {
    setInputValue(session.originalText);
    setLength(session.length);
    setLanguage(session.language);
    setCustomTitle(session.customTitle || '');
    setCustomInstructions(session.customInstructions || '');
    setHost1(session.host1 || '');
    setHost2(session.host2 || '');
    setHost1Role(session.host1Role || '');
    setHost2Role(session.host2Role || '');
    setHost1Description(session.host1Description || '');
    setHost2Description(session.host2Description || '');
    setHost1Voice(session.host1Voice || '');
    setHost2Voice(session.host2Voice || '');
    setCoverImage(session.coverImage);
    setShowSettings(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setCurrentSeries(null);
    setCurrentAudio(null);
    setGenerationState({ status: 'idle' });
    setInputValue('');
    setCustomTitle('');
    setCustomInstructions('');
    setHost1('');
    setHost2('');
    setHost1Role('');
    setHost2Role('');
    setHost1Description('');
    setHost2Description('');
    setHost1Voice('');
    setHost2Voice('');
    setCoverImage(undefined);
    setIsSidebarOpen(false);
  };

  const handleCreateSeries = () => {
    if (!newSeriesData.title.trim()) return;
    const ns: PodcastSeries = {
      id: Date.now().toString(),
      title: newSeriesData.title,
      description: newSeriesData.description,
      coverImage: newSeriesData.coverImage || undefined,
      createdAt: Date.now(),
      episodeIds: []
    };
    setSeries(prev => [ns, ...prev]);
    setIsSeriesModalOpen(false);
    setNewSeriesData({ title: '', description: '', coverImage: '' });
    loadSeries(ns);
  };

  const loadSeries = (s: PodcastSeries) => {
    setCurrentSeries(s);
    setCurrentSession(null);
    setCurrentAudio(null);
    setGenerationState({ status: 'idle' });
    setIsSidebarOpen(false);
  };

  const loadSession = (session: PodcastSession) => {
    setCurrentSession(session);
    setCurrentSeries(null);
    setCurrentAudio(null);
    setGenerationState({ status: 'idle' });
    setIsSidebarOpen(false);
    setCurrentTime(0);
    setSessionViewTab('transcript');
  };

  const deleteSeries = (id: string) => {
    setSeries(prev => prev.filter(s => s.id !== id));
    if (currentSeries?.id === id) setCurrentSeries(null);
    setHistory(prev => prev.map(ep => ep.seriesId === id ? { ...ep, seriesId: undefined } : ep));
  };

  // Fix: Implemented handleUpdateEpisodeSeries to allow moving sessions between programs
  const handleUpdateEpisodeSeries = (sessionId: string, seriesId?: string) => {
    setHistory(prev => prev.map(s => s.id === sessionId ? { ...s, seriesId } : s));
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, seriesId } : null);
    }
    setSeries(prev => prev.map(s => {
      const isNewSeries = s.id === seriesId;
      const wasInThisSeries = s.episodeIds.includes(sessionId);
      if (isNewSeries && !wasInThisSeries) {
        return { ...s, episodeIds: [...s.episodeIds, sessionId] };
      } else if (!isNewSeries && wasInThisSeries) {
        return { ...s, episodeIds: s.episodeIds.filter(id => id !== sessionId) };
      }
      return s;
    }));
  };

  if (view === 'api-docs') return <ApiDocs onBack={() => setView('landing')} />;
  if (view === 'landing') return <LandingPage onGetStarted={() => setView('app')} onOpenApiDocs={() => setView('api-docs')} />;

  const episodesInCurrentSeries = currentSeries ? history.filter(h => h.seriesId === currentSeries.id) : [];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <HistorySidebar
        history={history}
        series={series}
        onSelect={loadSession}
        onSelectSeries={loadSeries}
        onDelete={(id) => {
          const ep = history.find(e => e.id === id);
          if (ep?.seriesId) {
            setSeries(prev => prev.map(s => s.id === ep.seriesId ? { ...s, episodeIds: s.episodeIds.filter(sid => sid !== id) } : s));
          }
          setHistory(h => h.filter(x => x.id !== id));
          if (currentSession?.id === id) setCurrentSession(null);
        }}
        onDeleteSeries={deleteSeries}
        onNewSession={handleNewSession}
        onNewSeries={() => setIsSeriesModalOpen(true)}
        currentId={currentSession?.id}
        currentSeriesId={currentSeries?.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSeriesModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-brand-500" />
              Create New Program
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={newSeriesData.title}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, title: e.target.value })}
                  placeholder="e.g. The AI Daily, History Deep Dives..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Overall Theme / Global Context</label>
                <textarea
                  value={newSeriesData.description}
                  onChange={(e) => setNewSeriesData({ ...newSeriesData, description: e.target.value })}
                  placeholder="Describe what this entire program is about. Every episode will share this context."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500 h-24 resize-none text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsSeriesModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleCreateSeries} className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold shadow-lg">Create Program</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-brand-600 rounded-lg p-1.5 cursor-pointer hover:bg-brand-500 transition-colors" onClick={() => setView('landing')}>
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight cursor-pointer" onClick={() => setView('landing')}>
              Pod<span className="text-brand-500">vibe</span>
            </h1>
            {currentSeries && (
              <div className="flex items-center gap-2 ml-4 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full">
                <Library className="w-3.5 h-3.5 text-brand-400" />
                <span className="text-xs font-bold text-brand-300">Program: {currentSeries.title}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView('api-docs')} className="text-xs font-medium text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Code className="w-4 h-4" /> <span className="hidden sm:inline">API Docs</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-8">

                <div className="space-y-4">
                  <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 shadow-xl focus-within:ring-2 focus-within:ring-brand-500/50 transition-all z-20 relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentSeries ? `Add a new episode to "${currentSeries.title}"...` : "Paste your text, article content, or a link here..."}
                      className="w-full h-32 bg-slate-900 text-white p-4 rounded-xl resize-none focus:outline-none placeholder-slate-600 text-base"
                    />

                    <div className="px-4 py-3 bg-slate-900 border-t border-slate-800/50 flex flex-wrap items-center gap-4 text-sm relative z-20">
                      <div className="w-40">
                        <CustomDropdown value={length} onChange={(val) => setLength(val as PodcastLength)} icon={<Clock className="w-4 h-4 text-brand-500" />} options={[{ label: 'Short (~3 min)', value: 'Short' }, { label: 'Medium (~5 min)', value: 'Medium' }, { label: 'Long (~10 min)', value: 'Long' }]} />
                      </div>
                      <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>
                      <div className="w-48">
                        <CustomDropdown value={language} onChange={(val) => setLanguage(val as PodcastLanguage)} icon={<Globe className="w-4 h-4 text-brand-500" />} options={[{ label: 'English', value: 'English' }, { label: 'Français', value: 'French' }, { label: 'Français (CA)', value: 'FrenchCA' }, { label: 'Moroccan Darija', value: 'Darija' }, { label: 'Arabic', value: 'Arabic' }, { label: 'Español', value: 'Spanish' }, { label: 'Chinese', value: 'Chinese' }]} />
                      </div>
                      <div className="ml-auto">
                        <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${showSettings ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                          <Settings className="w-4 h-4" />
                          <span className="hidden sm:inline">Settings</span>
                        </button>
                      </div>
                    </div>

                    {showSettings && (
                      <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in slide-in-from-top-2">
                        <div className="col-span-1 md:col-span-2 space-y-2">
                          <label className="text-xs font-semibold text-slate-400">Episode Title</label>
                          <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Auto-generated if empty" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors" />
                        </div>

                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-brand-500 rounded-full"></div>
                            <label className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Persona 1</label>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
                              <input type="text" value={host1} onChange={(e) => setHost1(e.target.value)} placeholder="e.g. Alex" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Role</label>
                              <input type="text" value={host1Role} onChange={(e) => setHost1Role(e.target.value)} placeholder="e.g. Skeptic" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" />
                            </div>
                          </div>
                          <CustomDropdown value={host1Voice} onChange={setHost1Voice} icon={<Music className="w-3.5 h-3.5 text-slate-400" />} options={VOICE_OPTIONS} label="Voice" placeholder="Default for Language" />
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Persona Description</label>
                            <textarea
                              value={host1Description}
                              onChange={(e) => setHost1Description(e.target.value)}
                              placeholder="e.g. High-energy, loves tech metaphors..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs h-16 outline-none focus:border-brand-500 resize-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Persona 2</label>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
                              <input type="text" value={host2} onChange={(e) => setHost2(e.target.value)} placeholder="e.g. Sarah" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase">Role</label>
                              <input type="text" value={host2Role} onChange={(e) => setHost2Role(e.target.value)} placeholder="e.g. Expert" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                            </div>
                          </div>
                          <CustomDropdown value={host2Voice} onChange={setHost2Voice} icon={<Music className="w-3.5 h-3.5 text-slate-400" />} options={VOICE_OPTIONS} label="Voice" placeholder="Default for Language" />
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Persona Description</label>
                            <textarea
                              value={host2Description}
                              onChange={(e) => setHost2Description(e.target.value)}
                              placeholder="e.g. Calm, academic, uses precise facts..."
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs h-16 outline-none focus:border-emerald-500 resize-none"
                            />
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-2 pt-2 border-t border-slate-800">
                          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                            <PenTool className="w-3.5 h-3.5 text-slate-500" />
                            Overall Custom Instructions
                          </label>
                          <textarea value={customInstructions} onChange={(e) => setCustomInstructions(e.target.value)} placeholder="Any additional context for the AI podcasters..." className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm h-20 outline-none focus:border-brand-500" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-4 pb-3 pt-2 bg-slate-900/50 rounded-b-xl border-t border-slate-800/50">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> {currentSeries ? `Adding to ${currentSeries.title}` : "New Episode"}
                      </span>
                      <button onClick={onGenerateClick} disabled={generationState.status.startsWith('generating') || !inputValue.trim()} className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all">
                        {generationState.status.startsWith('generating') ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Vibing...</span></> : <><Sparkles className="w-4 h-4" /><span>Generate</span></>}
                      </button>
                    </div>
                  </div>
                </div>

                {currentSeries && !currentSession && (
                  <div className="animate-in fade-in duration-500">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 flex flex-col md:flex-row gap-8 items-start">
                      <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-brand-600/20 flex items-center justify-center border border-brand-500/30 shadow-2xl shrink-0">
                        <Library className="w-16 h-16 text-brand-500" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <h2 className="text-3xl font-bold text-white">{currentSeries.title}</h2>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-[10px] uppercase font-bold text-brand-500 tracking-widest mb-1">Global Context</h4>
                          <p className="text-slate-400 text-sm leading-relaxed">{currentSeries.description}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                          <span>{episodesInCurrentSeries.length} Episodes</span>
                          <span>•</span>
                          <span>Created {new Date(currentSeries.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="pt-2">
                          <button onClick={() => deleteSeries(currentSeries.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 uppercase tracking-wider">
                            <X className="w-3 h-3" /> Delete Program
                          </button>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4 px-1">Program Episodes</h3>
                    {episodesInCurrentSeries.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {episodesInCurrentSeries.map(ep => (
                          <div key={ep.id} onClick={() => loadSession(ep)} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-brand-500/50 cursor-pointer transition-all flex items-center gap-4 group">
                            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-brand-500 transition-colors">
                              <PlayCircle className="w-6 h-6 text-brand-400 group-hover:text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold truncate">{ep.title}</h4>
                              <p className="text-xs text-slate-500">{new Date(ep.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl py-12 text-center text-slate-600">
                        <Mic2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No episodes in this program yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {currentSession && (
                  <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                        <div className="flex-1 min-w-0">
                          <h2 className="text-2xl font-bold text-white truncate">{currentSession.title}</h2>
                          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Generated {new Date(currentSession.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-48">
                            <CustomDropdown
                              value={currentSession.seriesId || 'none'}
                              onChange={(val) => handleUpdateEpisodeSeries(currentSession.id, val === 'none' ? undefined : val)}
                              icon={currentSession.seriesId ? <FolderInput className="w-4 h-4 text-brand-400" /> : <FolderX className="w-4 h-4 text-slate-500" />}
                              options={[
                                { label: 'No Program', value: 'none' },
                                ...series.map(s => ({ label: s.title, value: s.id }))
                              ]}
                              placeholder="Move to Program"
                            />
                          </div>
                          <button
                            onClick={() => useAsTemplate(currentSession)}
                            className="p-2 bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white rounded-lg transition-all"
                            title="Use as Template (Clones Prompt & Settings)"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <Player audioPcm={currentAudio} title={currentSession.title} coverImage={currentSession.coverImage} isGenerating={generationState.status === 'generating_audio'} onRegenerateAudio={() => { }} onTimeUpdate={setCurrentTime} />
                    </div>

                    {currentSession.summary && (
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                        <div className="flex items-start gap-4 relative z-10">
                          <div className="bg-brand-500/10 p-2.5 rounded-lg shrink-0"><BookOpen className="w-5 h-5 text-brand-400" /></div>
                          <div className="space-y-2">
                            <h3 className="text-white font-semibold text-sm">Summary</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{currentSession.summary}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
                          <button
                            onClick={() => setSessionViewTab('transcript')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${sessionViewTab === 'transcript' ? 'bg-slate-800 text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Transcript
                          </button>
                          <button
                            onClick={() => setSessionViewTab('details')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${sessionViewTab === 'details' ? 'bg-slate-800 text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                          >
                            <Info className="w-3.5 h-3.5" />
                            Generation Info
                          </button>
                        </div>
                      </div>

                      {sessionViewTab === 'transcript' ? (
                        <Transcript session={currentSession} currentTime={currentTime} />
                      ) : (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[500px] animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Generation Metadata</h3>
                            <button
                              onClick={() => navigator.clipboard.writeText(currentSession.fullPrompt || '')}
                              className="text-xs flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition-colors border border-slate-700"
                            >
                              <Copy className="w-3 h-3" /> Copy Prompt
                            </button>
                          </div>
                          <div className="p-6 space-y-8 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Persona 1</h4>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold text-white">{currentSession.host1 || 'Default'}</p>
                                    <span className="text-[10px] bg-brand-900/30 text-brand-400 px-2 rounded-full border border-brand-500/20">{currentSession.host1Role || 'Host'}</span>
                                  </div>
                                  <p className="text-xs text-brand-400 font-mono">{currentSession.host1Voice || 'Default Voice'}</p>
                                  {currentSession.host1Description && <p className="text-[10px] text-slate-500 mt-2 italic leading-relaxed">"{currentSession.host1Description}"</p>}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Persona 2</h4>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold text-white">{currentSession.host2 || 'Default'}</p>
                                    <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 rounded-full border border-emerald-500/20">{currentSession.host2Role || 'Expert'}</span>
                                  </div>
                                  <p className="text-xs text-emerald-400 font-mono">{currentSession.host2Voice || 'Default Voice'}</p>
                                  {currentSession.host2Description && <p className="text-[10px] text-slate-500 mt-2 italic leading-relaxed">"{currentSession.host2Description}"</p>}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Configuration</h4>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex gap-4">
                                  <div>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase">Length</p>
                                    <p className="text-xs text-slate-300">{currentSession.length}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-slate-600 font-bold uppercase">Language</p>
                                    <p className="text-xs text-slate-300">{currentSession.language}</p>
                                  </div>
                                </div>
                              </div>
                              {currentSession.customInstructions && (
                                <div className="space-y-2">
                                  <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Custom Instructions</h4>
                                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <p className="text-xs text-slate-400 italic">"{currentSession.customInstructions}"</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest flex items-center gap-2">
                                System Prompt Used
                                <div className="h-px flex-1 bg-slate-800"></div>
                              </h4>
                              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                {currentSession.fullPrompt || 'System prompt not preserved for this session.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!currentSession && !currentSeries && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                      <FileText className="w-8 h-8 text-brand-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Ready to Vibe?</h3>
                    <p className="text-slate-400 max-w-md mx-auto">Paste an article above or create a <b>Program</b> to group episodes around a single theme.</p>
                  </div>
                )}
              </div>
            </div>
            <Footer onOpenApiDocs={() => setView('api-docs')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
