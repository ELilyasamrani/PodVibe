import React, { useState, useEffect, useRef } from 'react';
import { PodcastSession, GenerationState, PodcastLength, PodcastLanguage } from './types';
import { generatePodcastScript, generatePodcastAudio, estimateTimestamps } from './services/geminiService';
import { decodeAudioData } from './utils/audioUtils';
import ApiKeyInput from './components/ApiKeyInput';
import HistorySidebar from './components/HistorySidebar';
import Player from './components/Player';
import Transcript from './components/Transcript';
import { Headphones, Sparkles, MessageSquare, Menu, X, Linkedin, Clock, Globe, ChevronDown, Check, Settings, Mic2, FileText, User, Music } from 'lucide-react';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  icon: React.ReactNode;
  label?: string;
  placeholder?: string;
}

const CustomDropdown: React.FC<DropdownProps> = ({ value, onChange, options, icon, label, placeholder }) => {
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
    <div className="relative w-full" ref={containerRef}>
      {label && <label className="text-xs font-semibold text-slate-400 mb-1 block">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all border outline-none text-left ${
            isOpen ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
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
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${
                  value === option.value
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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [history, setHistory] = useState<PodcastSession[]>([]);
  const [currentSession, setCurrentSession] = useState<PodcastSession | null>(null);
  const [currentAudio, setCurrentAudio] = useState<Int16Array | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({ status: 'idle' });
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Options
  const [length, setLength] = useState<PodcastLength>('Medium');
  const [language, setLanguage] = useState<PodcastLanguage>('English');
  
  // Customization
  const [showSettings, setShowSettings] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [host1, setHost1] = useState('');
  const [host2, setHost2] = useState('');
  const [host1Voice, setHost1Voice] = useState('');
  const [host2Voice, setHost2Voice] = useState('');

  // Load state from local storage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedHistory = localStorage.getItem('podcast_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history when updated
  useEffect(() => {
    localStorage.setItem('podcast_history', JSON.stringify(history));
  }, [history]);

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleCreatePodcast = async () => {
    if (!apiKey || !inputValue.trim()) return;

    setGenerationState({ status: 'generating_script' });
    setCurrentAudio(null); // Reset audio for new session
    setCurrentTime(0);

    try {
      // 1. Generate Script
      const { title, script, lines, usedHost1, usedHost2 } = await generatePodcastScript(
        apiKey, 
        inputValue, 
        length, 
        language,
        {
          customTitle: customTitle.trim() || undefined,
          customInstructions: customInstructions.trim() || undefined,
          host1: host1.trim() || undefined,
          host2: host2.trim() || undefined
        }
      );
      
      const newSession: PodcastSession = {
        id: Date.now().toString(),
        title,
        originalText: inputValue,
        script,
        scriptLines: lines,
        createdAt: Date.now(),
        length,
        language,
        customTitle: customTitle.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
        host1: usedHost1,
        host2: usedHost2,
        host1Voice: host1Voice || undefined,
        host2Voice: host2Voice || undefined
      };

      setCurrentSession(newSession);
      // Optimistic update
      setHistory(prev => [newSession, ...prev]);

      // 2. Generate Audio
      setGenerationState({ status: 'generating_audio' });
      const audioData = await generatePodcastAudio(
        apiKey, 
        script, 
        language, 
        { host1: usedHost1, host2: usedHost2 },
        { host1Voice: host1Voice, host2Voice: host2Voice }
      );
      
      // 3. Decode to get duration and estimate timestamps
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(new Uint8Array(audioData.buffer), audioCtx);
      const duration = buffer.duration;
      
      const linesWithTimestamps = estimateTimestamps(lines, duration);
      
      const finalSession = { 
        ...newSession, 
        duration, 
        scriptLines: linesWithTimestamps 
      };

      setCurrentSession(finalSession);
      setHistory(prev => [finalSession, ...prev.filter(p => p.id !== finalSession.id)]); 
      setCurrentAudio(audioData);
      setGenerationState({ status: 'complete' });
      setInputValue(''); 
      // Reset settings
      setShowSettings(false);
      
    } catch (error: any) {
      console.error(error);
      setGenerationState({ 
        status: 'error', 
        error: error.message || "Failed to generate podcast. Please check your API key and try again." 
      });
    }
  };

  const handleRegenerateAudio = async () => {
    if (!apiKey || !currentSession) return;
    
    setGenerationState({ status: 'generating_audio' });
    try {
      const audioData = await generatePodcastAudio(
        apiKey, 
        currentSession.script, 
        currentSession.language,
        { 
            host1: currentSession.host1 || "Host 1", 
            host2: currentSession.host2 || "Host 2" 
        },
        {
          host1Voice: currentSession.host1Voice,
          host2Voice: currentSession.host2Voice
        }
      );
      setCurrentAudio(audioData);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(new Uint8Array(audioData.buffer), audioCtx);
      const linesWithTimestamps = estimateTimestamps(currentSession.scriptLines, buffer.duration);
      
      const updatedSession = { ...currentSession, duration: buffer.duration, scriptLines: linesWithTimestamps };
      setCurrentSession(updatedSession);
      setHistory(prev => prev.map(p => p.id === updatedSession.id ? updatedSession : p));
      
      setGenerationState({ status: 'complete' });
    } catch (error: any) {
      setGenerationState({ status: 'error', error: "Failed to regenerate audio." });
    }
  };

  const loadSession = (session: PodcastSession) => {
    setCurrentSession(session);
    setCurrentAudio(null); 
    setGenerationState({ status: 'idle' });
    setIsSidebarOpen(false); 
    setCurrentTime(0);
    // Restore options
    if (session.length) setLength(session.length);
    if (session.language) setLanguage(session.language);
    // Restore customization for quick edit (optional)
    setHost1(session.host1 || '');
    setHost2(session.host2 || '');
    setHost1Voice(session.host1Voice || '');
    setHost2Voice(session.host2Voice || '');
  };

  const deleteSession = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setCurrentAudio(null);
    }
  };

  if (!apiKey) {
    return <ApiKeyInput onSave={handleApiKeySave} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <HistorySidebar 
        history={history} 
        onSelect={loadSession} 
        onDelete={deleteSession}
        currentId={currentSession?.id} 
      />

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-80 h-full bg-slate-900 border-r border-slate-800 relative z-50">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="h-full pt-12">
               <HistorySidebar 
                  history={history} 
                  onSelect={loadSession} 
                  onDelete={deleteSession}
                  currentId={currentSession?.id} 
                />
            </div>
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="bg-brand-600 rounded-lg p-1.5">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Listen<span className="text-brand-500">In</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => { setApiKey(null); localStorage.removeItem('gemini_api_key'); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
             >
               Change Key
             </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Input Section */}
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl p-1 border border-slate-800 shadow-xl focus-within:ring-2 focus-within:ring-brand-500/50 transition-all z-20 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Paste your LinkedIn post content or a link here..."
                  className="w-full h-32 bg-slate-900 text-white p-4 rounded-xl resize-none focus:outline-none placeholder-slate-600 text-base"
                />
                
                {/* Options Toolbar */}
                <div className="px-4 py-3 bg-slate-900 border-t border-slate-800/50 flex flex-wrap items-center gap-4 text-sm relative z-20">
                   
                   <div className="w-40">
                    <CustomDropdown 
                        value={length}
                        onChange={(val) => setLength(val as PodcastLength)}
                        icon={<Clock className="w-4 h-4 text-brand-500" />}
                        options={[
                            { label: 'Short (~3 min)', value: 'Short' },
                            { label: 'Medium (~5 min)', value: 'Medium' },
                            { label: 'Long (~10 min)', value: 'Long' },
                        ]}
                    />
                   </div>

                   <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>

                   <div className="w-48">
                    <CustomDropdown 
                        value={language}
                        onChange={(val) => setLanguage(val as PodcastLanguage)}
                        icon={<Globe className="w-4 h-4 text-brand-500" />}
                        options={[
                            { label: 'English', value: 'English' },
                            { label: 'Français', value: 'French' },
                            { label: 'Français (Canadien)', value: 'FrenchCA' },
                            { label: 'Moroccan Darija', value: 'Darija' },
                            { label: 'Arabic (Fusha)', value: 'Arabic' },
                            { label: 'Español', value: 'Spanish' },
                            { label: 'Chinese (Mandarin)', value: 'Chinese' },
                        ]}
                    />
                   </div>

                   <div className="ml-auto">
                     <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                            showSettings ? 'text-brand-400 bg-brand-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                     >
                       <Settings className="w-4 h-4" />
                       Podcast Settings
                       <ChevronDown className={`w-3 h-3 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                     </button>
                   </div>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                   <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 animate-in slide-in-from-top-2">
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                           <FileText className="w-3 h-3" /> Title
                        </label>
                        <input 
                           type="text" 
                           value={customTitle}
                           onChange={(e) => setCustomTitle(e.target.value)}
                           placeholder="Auto-generated if empty"
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-600"
                        />
                      </div>

                      {/* Host 1 Config */}
                      <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                         <div className="flex items-center gap-2 text-brand-300 border-b border-slate-800 pb-2 mb-2">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Host 1 (Lead)</span>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500">Name</label>
                            <input 
                              type="text" 
                              value={host1}
                              onChange={(e) => setHost1(e.target.value)}
                              placeholder="e.g. Alex"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-600"
                            />
                         </div>
                         <div className="space-y-1">
                             <CustomDropdown 
                                value={host1Voice}
                                onChange={setHost1Voice}
                                icon={<Music className="w-3.5 h-3.5 text-slate-400" />}
                                options={VOICE_OPTIONS}
                                label="Voice"
                                placeholder="Default Voice"
                             />
                         </div>
                      </div>

                      {/* Host 2 Config */}
                      <div className="space-y-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                         <div className="flex items-center gap-2 text-emerald-300 border-b border-slate-800 pb-2 mb-2">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Host 2 (Expert)</span>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500">Name</label>
                            <input 
                              type="text" 
                              value={host2}
                              onChange={(e) => setHost2(e.target.value)}
                              placeholder="e.g. Sarah"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-600"
                            />
                         </div>
                         <div className="space-y-1">
                             <CustomDropdown 
                                value={host2Voice}
                                onChange={setHost2Voice}
                                icon={<Music className="w-3.5 h-3.5 text-slate-400" />}
                                options={VOICE_OPTIONS}
                                label="Voice"
                                placeholder="Default Voice"
                             />
                         </div>
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                           <Mic2 className="w-3 h-3" /> Custom Instructions
                        </label>
                        <textarea 
                           value={customInstructions}
                           onChange={(e) => setCustomInstructions(e.target.value)}
                           placeholder="e.g. Make it funny, focus on the technical details, explain like I'm 5..."
                           className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-600 h-20 resize-none"
                        />
                      </div>
                   </div>
                )}

                <div className="flex justify-between items-center px-4 pb-3 pt-2 bg-slate-900/50 rounded-b-xl border-t border-slate-800/50">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Linkedin className="w-3 h-3" />
                    Paste text or link
                  </span>
                  <button
                    onClick={handleCreatePodcast}
                    disabled={generationState.status.startsWith('generating') || !inputValue.trim()}
                    className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
                  >
                    {generationState.status === 'generating_script' || generationState.status === 'generating_audio' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Podcast</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {generationState.status === 'error' && (
                <div className="bg-red-900/20 border border-red-900/50 text-red-200 p-4 rounded-lg text-sm">
                  {generationState.error}
                </div>
              )}
            </div>

            {/* Content Area */}
            {currentSession && (
              <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                
                {/* Player Section */}
                <Player 
                  audioPcm={currentAudio} 
                  title={currentSession.title}
                  isGenerating={generationState.status === 'generating_audio'}
                  onRegenerateAudio={handleRegenerateAudio}
                  onTimeUpdate={setCurrentTime}
                />

                {/* Transcript Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium px-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>Episode Script</span>
                  </div>
                  <Transcript session={currentSession} currentTime={currentTime} />
                </div>
              </div>
            )}
            
            {!currentSession && history.length > 0 && (
               <div className="text-center py-20 opacity-50 relative z-0">
                 <p className="text-slate-400">Select an episode from history to play</p>
               </div>
            )}

            {!currentSession && history.length === 0 && (
               <div className="text-center py-12 relative z-0">
                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                   <Linkedin className="w-8 h-8 text-brand-500" />
                 </div>
                 <h3 className="text-lg font-semibold text-white mb-2">Ready to Listen?</h3>
                 <p className="text-slate-400 max-w-md mx-auto">
                   Paste a LinkedIn post or link above. ListenIn uses Gemini to analyze the content and creates a dynamic 2-person podcast episode for you.
                 </p>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;