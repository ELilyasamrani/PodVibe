import React, { useEffect, useRef, useMemo } from 'react';
import { PodcastSession } from '../types';

interface TranscriptProps {
  session: PodcastSession;
  currentTime?: number;
}

const Transcript: React.FC<TranscriptProps> = ({ session, currentTime = 0 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active line
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeElement = scrollRef.current.querySelector('.active-transcript-line');
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime]);

  const lines = session.scriptLines || [];

  // Dynamically determine host 1 and host 2 from the script
  // Assumes the first speaker in the script is Host 1
  const speakers = useMemo(() => {
    const unique = Array.from(new Set(lines.map(l => l.speaker)));
    return {
      host1: unique[0] || 'Host 1',
      host2: unique[1] || 'Host 2'
    };
  }, [lines]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
        <h3 className="font-semibold text-white">Transcript</h3>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {lines.length === 0 ? (
          <div className="text-slate-500 text-center py-10">No transcript available</div>
        ) : (
           lines.map((line, idx) => {
            const isHost1 = line.speaker === speakers.host1;
            const isActive = currentTime >= line.startTime && currentTime <= line.endTime;
            
            return (
              <div 
                key={idx} 
                className={`flex gap-3 transition-opacity duration-300 ${isHost1 ? 'flex-row' : 'flex-row-reverse'} ${isActive ? 'opacity-100 active-transcript-line' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-lg select-none ${
                  isHost1 ? 'bg-brand-600 text-white' : 'bg-emerald-600 text-white'
                } ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 transition-transform' : ''}`}>
                  {line.speaker[0]}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed transition-all duration-300 ${
                  isHost1 
                    ? 'bg-slate-800 text-slate-200 rounded-tl-none' 
                    : 'bg-slate-800/50 text-slate-300 rounded-tr-none'
                } ${isActive ? 'ring-1 ring-brand-500/50 bg-slate-700 shadow-lg' : ''} ${
                    session.language === 'Darija' && /[\u0600-\u06FF]/.test(line.text) ? 'font-arabic text-right' : ''
                }`}>
                  <span className="block text-xs font-semibold opacity-50 mb-1">{line.speaker}</span>
                  {line.text}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Transcript;