import React, { useEffect, useRef, useMemo, useState } from 'react';
import { PodcastSession } from '../types';

interface TranscriptProps {
  session: PodcastSession;
  currentTime?: number;
}

const Transcript: React.FC<TranscriptProps> = ({ session, currentTime = 0 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lastActiveIndex, setLastActiveIndex] = useState(-1);

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

  // Find active line index
  const activeIndex = useMemo(() => {
    return lines.findIndex(line => currentTime >= line.startTime && currentTime <= line.endTime);
  }, [lines, currentTime]);

  // Auto-scroll logic
  useEffect(() => {
    if (!scrollRef.current || isHovering || activeIndex === -1 || activeIndex === lastActiveIndex) return;
    
    setLastActiveIndex(activeIndex);
    const activeElement = scrollRef.current.children[activeIndex];
    
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isHovering, lastActiveIndex]);

  return (
    <div 
      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[500px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
        <h3 className="font-semibold text-white">Transcript</h3>
        {isHovering && <span className="text-xs text-slate-500 animate-pulse">Auto-scroll paused</span>}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {lines.length === 0 ? (
          <div className="text-slate-500 text-center py-10">No transcript available</div>
        ) : (
           lines.map((line, idx) => {
            const isHost1 = line.speaker === speakers.host1;
            const isActive = idx === activeIndex;
            
            return (
              <div 
                key={idx} 
                className={`flex gap-3 transition-opacity duration-300 ${isHost1 ? 'flex-row' : 'flex-row-reverse'} ${isActive ? 'opacity-100 active-transcript-line' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-lg select-none relative ${
                    isHost1 ? 'bg-brand-600 text-white' : 'bg-emerald-600 text-white'
                  } ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 transition-transform' : ''}`}>
                    {line.speaker[0]}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                     isHost1 ? 'bg-brand-900/50 text-brand-300' : 'bg-emerald-900/50 text-emerald-300'
                  }`}>
                    {isHost1 ? 'Host' : 'Guest'}
                  </span>
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