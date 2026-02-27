
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PodcastSession, GenerationState, PodcastLength, PodcastLanguage, PodcastOptions, PodcastSeries, SeriesHistory, Persona, FileAttachment } from './types';
import { generatePodcastScript, generatePodcastAudio, estimateTimestamps } from './services/geminiService';
import { decodeAudioData, createWavBlob } from './utils/audioUtils';
import HistorySidebar from './components/HistorySidebar';
import PersonaModal from './components/PersonaModal';
import Player from './components/Player';
import Transcript from './components/Transcript';
import LandingPage from './components/LandingPage';
import ApiDocs from './components/ApiDocs';
import Footer from './components/Footer';
import ErrorMessage from './components/ErrorMessage';
import FeedbackModal from './components/FeedbackModal';
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
  const [duration, setDuration] = useState<number>(5);

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
  const [host1Avatar, setHost1Avatar] = useState<string | undefined>(undefined);
  const [host1AvatarType, setHost1AvatarType] = useState<'icon' | 'image' | undefined>(undefined);
  const [host2Avatar, setHost2Avatar] = useState<string | undefined>(undefined);
  const [host2AvatarType, setHost2AvatarType] = useState<'icon' | 'image' | undefined>(undefined);
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);

  // Persona Registry
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);

  // File Attachments
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isTranscriptInAttachments, setIsTranscriptInAttachments] = useState(false);

  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Tracking Metrics
  const [sessionStartTime] = useState<number>(Date.now());
  const [podcastsCreatedCount, setPodcastsCreatedCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store last generation parameters for retry
  const lastGenerationParams = useRef<any>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('podcast_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    const savedSeries = localStorage.getItem('podcast_series');
    if (savedSeries) {
      try { setSeries(JSON.parse(savedSeries)); } catch (e) { console.error(e); }
    }

    const savedPersonas = localStorage.getItem('podvibe_personas');
    if (savedPersonas) {
      try { setPersonas(JSON.parse(savedPersonas)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    // Start feedback timer if in 'app' view and hasn't given feedback yet
    const hasGivenFeedback = localStorage.getItem('podvibe_feedback_submitted');

    if (view === 'app' && !hasGivenFeedback) {
      feedbackTimerRef.current = setTimeout(() => {
        setShowFeedback(true);
      }, 60000); // 1 minute
    }

    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, [view]);

  useEffect(() => {
    localStorage.setItem('podcast_history', JSON.stringify(history));
    localStorage.setItem('podcast_series', JSON.stringify(series));
    localStorage.setItem('podvibe_personas', JSON.stringify(personas));
  }, [history, series, personas]);

  const handleFeedbackSubmit = async (rating: number, comment: string, email?: string) => {
    const timeSpentMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
    const feedback = {
      rating,
      comment,
      email: email || feedbackEmail,
      timestamp: Date.now(),
      metrics: {
        timeSpentMinutes,
        podcastsCreatedCount,
        errorCount
      }
    };

    // local storage persistence
    const allFeedback = JSON.parse(localStorage.getItem('podvibe_all_feedback') || '[]');
    allFeedback.push(feedback);
    localStorage.setItem('podvibe_all_feedback', JSON.stringify(allFeedback));
    localStorage.setItem('podvibe_feedback_submitted', 'true');

    // Clear pending feedback state
    setFeedbackRating(0);
    setFeedbackComment('');
    setFeedbackEmail('');

    console.log('Feedback submitted locally with metrics:', feedback);

    // Webhook integration
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (webhookUrl && webhookUrl !== 'undefined') {
      try {
        const timeSpentMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: "Podvibe Feedback",
            content: `New Feedback Received!`,
            embeds: [{
              title: "User Feedback",
              color: 0x3b82f6, // Brand blue
              fields: [
                { name: "Rating", value: "⭐".repeat(rating), inline: true },
                { name: "Email", value: email || feedbackEmail || "_Not provided_", inline: true },
                { name: "Comment", value: comment || "_No comment provided_" },
                {
                  name: "Usage Stats", value: [
                    `⏱️ **Time Spent:** ${timeSpentMinutes} min`,
                    `🎙️ **Podcasts Created:** ${podcastsCreatedCount}`,
                    `⚠️ **Errors Encountered:** ${errorCount}`
                  ].join('\n')
                },
                { name: "Time Submitted", value: new Date().toLocaleString(), inline: true }
              ],
              footer: { text: "Podvibe Feedback System" }
            }]
          })
        });
        if (!response.ok) throw new Error('Webhook failed');
        console.log('Feedback sent to webhook successfully');
      } catch (err) {
        console.error('Failed to send feedback to webhook:', err);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (attachments.length + files.length > 5) {
      alert('You can only attach up to 5 files.');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePersona = (persona: Persona) => {
    setPersonas(prev => {
      const exists = prev.find(p => p.id === persona.id);
      if (exists) {
        return prev.map(p => p.id === persona.id ? persona : p);
      }
      return [...prev, persona];
    });
    setIsPersonaModalOpen(false);
    setEditingPersona(undefined);
  };

  const handleDeletePersona = (id: string) => {
    if (confirm('Are you sure you want to delete this persona?')) {
      setPersonas(prev => prev.filter(p => p.id !== id));
      setIsPersonaModalOpen(false);
      setEditingPersona(undefined);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setEditingPersona(persona);
    setIsPersonaModalOpen(true);
  };

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

    // Save params for retry
    lastGenerationParams.current = params;

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
        host1Avatar: params.options.host1Avatar,
        host1AvatarType: params.options.host1AvatarType,
        host2Avatar: params.options.host2Avatar,
        host2AvatarType: params.options.host2AvatarType,
        host1Voice: params.options.host1Voice,
        host2Voice: params.options.host2Voice,
        coverImage: params.options.coverImage,
        fullPrompt: prompt
      };

      setGenerationState({ status: 'generating_audio', session: newSession });
      setCurrentSession(newSession);

      const audioData = await generatePodcastAudio(
        lines,
        params.language,
        { host1: usedHost1, host2: usedHost2 },
        { host1Voice: params.options.host1Voice, host2Voice: params.options.host2Voice }
      );

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(new Uint8Array(audioData.buffer), audioCtx);
      const linesWithTimestamps = estimateTimestamps(lines, buffer.duration);

      const finalSession: PodcastSession = {
        ...newSession,
        duration: buffer.duration,
        scriptLines: linesWithTimestamps
      };

      setCurrentSession(finalSession);
      setHistory(prev => [finalSession, ...prev]);
      setCurrentAudio(audioData);
      setGenerationState({ status: 'complete', session: finalSession });
      setPodcastsCreatedCount(prev => prev + 1);

      if (params.seriesId) {
        setSeries(prev => prev.map(s =>
          s.id === params.seriesId
            ? { ...s, episodeIds: [...s.episodeIds, finalSession.id] }
            : s
        ));
      }

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
      console.error('Generation failed:', error);
      setErrorCount(prev => prev + 1);
      setGenerationState({ status: 'error', error: error.message || "Failed to generate podcast." });
    }
  }, [sessionStartTime, podcastsCreatedCount, errorCount, history, series]);

  const onGenerateClick = () => {
    if (!inputValue.trim() && attachments.length === 0) return;

    // Gather history for continuity if we are in a series
    let seriesHistory: SeriesHistory[] | undefined = undefined;
    if (currentSeries) {
      seriesHistory = history
        .filter(h => h.seriesId === currentSeries.id)
        .slice(0, 5) // Take last 5 episodes for context
        .map(h => ({
          title: h.title,
          summary: h.summary || '',
          host1: h.host1 || '',
          host2: h.host2 || '',
          host1Role: h.host1Role || '',
          host2Role: h.host2Role || ''
        }))
        .reverse(); // Order from oldest to newest for the prompt
    }

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
        host1Avatar: host1Avatar || undefined,
        host1AvatarType: host1AvatarType || undefined,
        host2Avatar: host2Avatar || undefined,
        host2AvatarType: host2AvatarType || undefined,
        host1Voice: host1Voice || undefined,
        host2Voice: host2Voice || undefined,
        coverImage: coverImage,
        seriesContext: currentSeries?.description,
        seriesHistory,
        attachments,
        isTranscriptInAttachments,
        duration
      }
    });

    setInputValue('');
    setAttachments([]); // Clear attachments after generation
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
    setHost1Avatar(session.host1Avatar);
    setHost1AvatarType(session.host1AvatarType);
    setHost2Avatar(session.host2Avatar);
    setHost2AvatarType(session.host2AvatarType);
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
    setHost1Avatar(undefined);
    setHost1AvatarType(undefined);
    setHost2Avatar(undefined);
    setHost2AvatarType(undefined);
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
        personas={personas}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelect={(session) => {
          setCurrentSession(session);
          setCurrentAudio(null);
          if (session.scriptLines) {
            setGenerationState({ status: 'complete', session });
          }
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onSelectSeries={(s) => {
          setCurrentSeries(s);
          setCurrentSession(null);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }}
        onSelectPersona={handleSelectPersona}
        onDelete={(id) => setHistory(prev => prev.filter(h => h.id !== id))}
        onDeleteSeries={(id) => setSeries(prev => prev.filter(s => s.id !== id))}
        onDeletePersona={handleDeletePersona}
        onNewSession={handleNewSession}
        onNewSeries={() => setIsSeriesModalOpen(true)}
        onNewPersona={() => {
          setEditingPersona(undefined);
          setIsPersonaModalOpen(true);
        }}
        currentId={currentSession?.id}
        currentSeriesId={currentSeries?.id}
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

      {isPersonaModalOpen && (
        <PersonaModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          onSave={handleSavePersona}
          editingPersona={editingPersona}
        />
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
            <button onClick={() => setShowFeedback(true)} className="text-xs font-medium text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Submit feedback</span>
            </button>
            <button onClick={() => setView('api-docs')} className="text-xs font-medium text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Code className="w-4 h-4" /> <span className="hidden sm:inline">API Docs</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col">
            <div className="flex-1 p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-8">

                {generationState.status === 'error' && (
                  <ErrorMessage
                    error={generationState.error || "An unknown error occurred."}
                    onRetry={() => lastGenerationParams.current && processGeneration(lastGenerationParams.current)}
                    onClose={() => setGenerationState({ status: 'idle' })}
                  />
                )}

                <div className="flex flex-col gap-4">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 to-emerald-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition-all"></div>
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={currentSeries ? "Add an episode to this program..." : "What's the vibe today? Paste an article, a topic, or just an idea..."}
                      className="w-full h-40 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 pl-12 pr-24 focus:outline-none focus:border-brand-500/50 transition-all resize-none relative z-10 text-lg leading-relaxed placeholder:text-slate-600"
                    />
                    <Sparkles className="absolute left-5 top-7 w-5 h-5 text-brand-500 z-20 animate-pulse pointer-events-none" />

                    <div className="absolute right-4 bottom-4 flex items-center gap-3 z-20">
                      {/* Attachments Display */}
                      {attachments.length > 0 && (
                        <div className="flex -space-x-2 mr-2">
                          {attachments.map((file, i) => (
                            <div key={i} className="group/file relative">
                              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 overflow-hidden shadow-lg">
                                {file.type.startsWith('image/') ? (
                                  <img src={`data:${file.type};base64,${file.data}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>
                              <button
                                onClick={() => removeAttachment(i)}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700/50 group/upload relative">
                        <Upload className="w-5 h-5 transition-transform group-hover/upload:-translate-y-0.5" />
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.docx"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/upload:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700 font-bold">
                          Add Files (Max 5)
                        </span>
                      </label>

                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2.5 rounded-xl transition-all border ${showSettings ? 'bg-brand-600/20 border-brand-500/50 text-brand-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/50'}`}
                        title="Advanced Settings"
                      >
                        <Settings className={`w-5 h-5 ${showSettings ? 'animate-spin-slow' : ''}`} />
                      </button>

                      <button
                        onClick={onGenerateClick}
                        disabled={generationState.status === 'generating_script' || generationState.status === 'generating_audio' || (!inputValue.trim() && attachments.length === 0)}
                        className={`p-3 rounded-xl transition-all shadow-xl flex items-center justify-center ${(!inputValue.trim() && attachments.length === 0) || generationState.status === 'generating_script' || generationState.status === 'generating_audio'
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700/50'
                          : 'bg-brand-600 hover:bg-brand-500 text-white hover:scale-105 active:scale-95 shadow-brand-500/20'
                          }`}
                      >
                        {generationState.status === 'generating_script' || generationState.status === 'generating_audio' ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Zap className="w-6 h-6 fill-current" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Transcript Toggle UI */}
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-3 px-2 py-1">
                      <button
                        onClick={() => setIsTranscriptInAttachments(!isTranscriptInAttachments)}
                        className={`flex items-center gap-2 group transition-colors ${isTranscriptInAttachments ? 'text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${isTranscriptInAttachments ? 'bg-brand-600' : 'bg-slate-800'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${isTranscriptInAttachments ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider">Transcript in attachments</span>
                      </button>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">AI will focus on the dialogue in your files</span>
                    </div>
                  )}

                  {showSettings && (
                    <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 animate-in slide-in-from-top-2">
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-400">Episode Title</label>
                        <input type="text" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Auto-generated if empty" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500 transition-colors" />
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-xs font-semibold text-slate-400">Language</label>
                        <CustomDropdown
                          value={language}
                          onChange={(val) => setLanguage(val as PodcastLanguage)}
                          icon={<Globe className="w-4 h-4 text-brand-500" />}
                          options={[
                            { label: 'English', value: 'English' },
                            { label: 'French', value: 'French' },
                            { label: 'French (Canada)', value: 'FrenchCA' },
                            { label: 'Darija (Moroccan)', value: 'Darija' },
                            { label: 'Arabic', value: 'Arabic' },
                            { label: 'Spanish', value: 'Spanish' },
                            { label: 'Chinese', value: 'Chinese' },
                          ]}
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-brand-500" />
                            Target Duration: <span className="text-brand-400 font-bold">{duration} minutes</span>
                          </label>
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Max 20 Min</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            className="flex-1 accent-brand-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="grid grid-cols-4 gap-1 flex-shrink-0">
                            {[2, 5, 10, 20].map(m => (
                              <button
                                key={m}
                                onClick={() => setDuration(m)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${duration === m ? 'bg-brand-600/20 border-brand-500 text-brand-400' : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'}`}
                              >
                                {m}m
                              </button>
                            ))}
                          </div>
                        </div>
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
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                            Registry Load
                            <button onClick={() => { setEditingPersona(undefined); setIsPersonaModalOpen(true); }} className="text-brand-500 hover:underline flex items-center gap-1 normal-case">
                              <Plus className="w-2.5 h-2.5" /> New
                            </button>
                          </label>
                          <CustomDropdown
                            value=""
                            onChange={(id) => {
                              const p = personas.find(p => p.id === id);
                              if (p) {
                                setHost1(p.name);
                                setHost1Role(p.role);
                                setHost1Voice(p.voice);
                                setHost1Description(p.description);
                                setHost1Avatar(p.avatarValue);
                                setHost1AvatarType(p.avatarType);
                              }
                            }}
                            icon={<User className="w-3.5 h-3.5 text-brand-500" />}
                            options={[
                              { label: "Select Persona", value: "" },
                              ...personas.map(p => ({ label: `${p.name} (${p.role})`, value: p.id }))
                            ]}
                            placeholder="Registry..."
                          />
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
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-between">
                            Registry Load
                            <button onClick={() => { setEditingPersona(undefined); setIsPersonaModalOpen(true); }} className="text-brand-500 hover:underline flex items-center gap-1 normal-case">
                              <Plus className="w-2.5 h-2.5" /> New
                            </button>
                          </label>
                          <CustomDropdown
                            value=""
                            onChange={(id) => {
                              const p = personas.find(p => p.id === id);
                              if (p) {
                                setHost2(p.name);
                                setHost2Role(p.role);
                                setHost2Voice(p.voice);
                                setHost2Description(p.description);
                                setHost2Avatar(p.avatarValue);
                                setHost2AvatarType(p.avatarType);
                              }
                            }}
                            icon={<User className="w-3.5 h-3.5 text-emerald-500" />}
                            options={[
                              { label: "Select Persona", value: "" },
                              ...personas.map(p => ({ label: `${p.name} (${p.role})`, value: p.id }))
                            ]}
                            placeholder="Registry..."
                          />
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
            <Footer onOpenApiDocs={() => setView('api-docs')} />
          </div >
        </div >

        {showFeedback && (
          <FeedbackModal
            onClose={() => setShowFeedback(false)}
            onSubmit={handleFeedbackSubmit}
            rating={feedbackRating}
            comment={feedbackComment}
            email={feedbackEmail}
            onRatingChange={setFeedbackRating}
            onCommentChange={setFeedbackComment}
            onEmailChange={setFeedbackEmail}
          />
        )}
        {
          isPersonaModalOpen && (
            <PersonaModal
              isOpen={isPersonaModalOpen}
              persona={editingPersona}
              onClose={() => {
                setIsPersonaModalOpen(false);
                setEditingPersona(undefined);
              }}
              onSave={handleSavePersona}
              onDelete={handleDeletePersona}
            />
          )
        }
      </div >
    </div >
  );
};

export default App;
