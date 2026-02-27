import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Download, Share2, Rewind, FastForward, RotateCcw, Volume2, VolumeX, Volume1, Video, Check, Linkedin, Facebook, Twitter, Instagram, Music, Gauge, FileAudio, Loader2 } from 'lucide-react';
import { createWavUrl } from '../utils/audioUtils';

interface PlayerProps {
  audioPcm: Int16Array | null;
  title: string;
  coverImage?: string;
  host1Avatar?: string;
  host1AvatarType?: 'icon' | 'image';
  host2Avatar?: string;
  host2AvatarType?: 'icon' | 'image';
  isGenerating: boolean;
  onRegenerateAudio: () => void;
  onTimeUpdate?: (time: number) => void;
}

const getSupportedMimeType = () => {
  // Explicitly include audio codecs (opus) to prevent "audio track cannot be recorded" errors
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
};

const Player: React.FC<PlayerProps> = ({ audioPcm, title, coverImage, host1Avatar, host1AvatarType, host2Avatar, host2AvatarType, isGenerating, onRegenerateAudio, onTimeUpdate }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null); // Offscreen canvas for video recording
  const imageRef = useRef<HTMLImageElement | null>(null);
  const host1ImageRef = useRef<HTMLImageElement | null>(null);
  const host2ImageRef = useRef<HTMLImageElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null); // Destination for recorder

  const animationFrameRef = useRef<number>(0);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing' | 'done'>('idle');
  const [videoMode, setVideoMode] = useState<'teaser' | 'full'>('teaser');
  const [isConvertingMp3, setIsConvertingMp3] = useState(false);

  // Setup Audio Source
  useEffect(() => {
    if (audioPcm) {
      const url = createWavUrl(audioPcm);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioPcm]);

  // Load Cover Image
  useEffect(() => {
    if (coverImage) {
      const img = new Image();
      img.src = coverImage;
      img.onload = () => {
        imageRef.current = img;
      };
    } else {
      imageRef.current = null;
    }
  }, [coverImage]);

  // Load Host Avatars
  useEffect(() => {
    if (host1Avatar && host1AvatarType === 'image') {
      const img = new Image();
      img.src = host1Avatar;
      img.onload = () => { host1ImageRef.current = img; };
    } else {
      host1ImageRef.current = null;
    }
  }, [host1Avatar, host1AvatarType]);

  useEffect(() => {
    if (host2Avatar && host2AvatarType === 'image') {
      const img = new Image();
      img.src = host2Avatar;
      img.onload = () => { host2ImageRef.current = img; };
    } else {
      host2ImageRef.current = null;
    }
  }, [host2Avatar, host2AvatarType]);

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Setup Visualizer when playing starts
  useEffect(() => {
    if ((!isPlaying && recordingState === 'idle') || !audioRef.current || sourceRef.current) return;

    const initAudioContext = () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        if (!sourceRef.current && audioRef.current) {
          sourceRef.current = ctx.createMediaElementSource(audioRef.current);
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;

          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);

          // Setup recording destination
          destRef.current = ctx.createMediaStreamDestination();
          sourceRef.current.connect(destRef.current);
        }
      } catch (e) {
        console.error("Audio context init failed", e);
      }
    };

    initAudioContext();
  }, [isPlaying, recordingState]);

  // Visualizer Loop
  useEffect(() => {
    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw mirrored bars
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        // Use brand colors
        const gradient = ctx.createLinearGradient(0, canvas.height / 2 - barHeight, 0, canvas.height / 2 + barHeight);
        gradient.addColorStop(0, '#6366f1'); // Brand 500
        gradient.addColorStop(0.5, '#e0e7ff'); // Brand 100
        gradient.addColorStop(1, '#6366f1'); // Brand 500

        ctx.fillStyle = gradient;

        // Draw centered bars
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);

        x += barWidth;
      }

      // Draw Host Avatars in main visualizer
      const drawMiniAvatar = (img: HTMLImageElement | null, type: string | undefined, val: string | undefined, x: number, y: number, color: string) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.clip();

        if (type === 'image' && img) {
          ctx.drawImage(img, x - 20, y - 20, 40, 40);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - 20, y - 20, 40, 40);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val ? val[0].toUpperCase() : 'H', x, y);
        }
        ctx.restore();

        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawMiniAvatar(host1ImageRef.current, host1AvatarType, host1Avatar, 40, canvas.height / 2, '#6366f1');
      drawMiniAvatar(host2ImageRef.current, host2AvatarType, host2Avatar, canvas.width - 40, canvas.height / 2, '#10b981');

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying || recordingState === 'recording') {
      draw();
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, recordingState]);

  // Video Recording Loop (Teaser/Full)
  useEffect(() => {
    if (recordingState !== 'recording' || !videoCanvasRef.current || !analyserRef.current) return;

    let frameId = 0;
    const vCanvas = videoCanvasRef.current;
    const ctx = vCanvas.getContext('2d');

    if (!ctx) return;

    const drawVideoFrame = () => {
      // 1. Background
      if (imageRef.current) {
        // Draw Image with object-cover logic
        const img = imageRef.current;
        const scale = Math.max(vCanvas.width / img.width, vCanvas.height / img.height);
        const x = (vCanvas.width / 2) - (img.width / 2) * scale;
        const y = (vCanvas.height / 2) - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Dark Overlay at bottom for text readability
        const gradient = ctx.createLinearGradient(0, vCanvas.height * 0.5, 0, vCanvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.6, 'rgba(0,0,0,0.6)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, vCanvas.width, vCanvas.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, vCanvas.width, vCanvas.height);
        gradient.addColorStop(0, '#1e1b4b'); // indigo-950
        gradient.addColorStop(1, '#020617'); // slate-950
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, vCanvas.width, vCanvas.height);
      }

      // 2. Logo Area
      ctx.fillStyle = '#6366f1'; // Brand 500 (Indigo)
      ctx.font = 'bold 60px Rubik, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText("Podvibe", vCanvas.width / 2, 120);
      ctx.shadowBlur = 0;

      // 3. Title Area
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Rubik, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      const maxWidth = vCanvas.width - 100;
      const words = title.split(' ');
      let line = '';
      let y = vCanvas.height / 2 - 40;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, vCanvas.width / 2, y);
          line = words[n] + ' ';
          y += 50;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, vCanvas.width / 2, y);
      ctx.shadowBlur = 0;

      // 4. Spectrograph
      const bufferLength = analyserRef.current!.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current!.getByteFrequencyData(dataArray);

      const barWidth = (vCanvas.width / bufferLength) * 1.5;
      let x = 0;
      const centerY = vCanvas.height - 200;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * 300;

        ctx.fillStyle = '#818cf8'; // Brand 400
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        x += barWidth + 2;
      }

      // 5. Host Avatars
      const drawAvatar = (img: HTMLImageElement | null, type: string | undefined, val: string | undefined, x: number, y: number, color: string) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.clip();

        if (type === 'image' && img) {
          ctx.drawImage(img, x - 60, y - 60, 120, 120);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - 60, y - 60, 120, 120);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 60px sans-serif';
          ctx.fillText(val ? val[0].toUpperCase() : 'H', x, y + 20);
        }
        ctx.restore();

        // Ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.stroke();
      };

      drawAvatar(host1ImageRef.current, host1AvatarType, host1Avatar, vCanvas.width * 0.25, vCanvas.height - 350, '#6366f1');
      drawAvatar(host2ImageRef.current, host2AvatarType, host2Avatar, vCanvas.width * 0.75, vCanvas.height - 350, '#10b981');

      // 5. Footer (Removed "AI Generated Preview" as requested)
      // ctx.fillStyle = '#94a3b8';
      // ctx.font = '24px Rubik, sans-serif';
      // ctx.fillText("AI-Generated Podcast Teaser", vCanvas.width / 2, vCanvas.height - 50);

      frameId = requestAnimationFrame(drawVideoFrame);
    };

    drawVideoFrame();
    return () => cancelAnimationFrame(frameId);
  }, [recordingState, title, coverImage]);

  // Handle Time Update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      setCurrentTime(curr);
      onTimeUpdate?.(curr);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    // If recording full video, stop when ended
    if (recordingState === 'recording' && videoMode === 'full') {
      stopRecording();
    }

    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(Math.max(audioRef.current.currentTime + seconds, 0), duration);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
      // If unmuting and volume was 0, set to 0.5
      if (!newMuted && volume === 0) {
        setVolume(0.5);
        audioRef.current.volume = 0.5;
      }
    }
  };

  const downloadWav = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
      a.click();
      setIsDownloadMenuOpen(false);
    }
  };

  const downloadMp3 = () => {
    if (!audioPcm) return;
    setIsConvertingMp3(true);

    // Defer to next tick to allow UI to update
    setTimeout(() => {
      try {
        const lamejs = (window as any).lamejs;
        if (!lamejs) {
          alert("MP3 encoder library not loaded. Please refresh.");
          setIsConvertingMp3(false);
          return;
        }

        const mp3encoder = new lamejs.Mp3Encoder(1, 24000, 128); // Mono, 24kHz, 128kbps
        const samples = audioPcm;
        const mp3Data = [];
        const sampleBlockSize = 1152; // Must be multiple of 576

        for (let i = 0; i < samples.length; i += sampleBlockSize) {
          const sampleChunk = samples.subarray(i, i + sampleBlockSize);
          const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }

        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
        a.click();

        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("MP3 conversion failed", e);
        alert("Failed to convert audio to MP3.");
      } finally {
        setIsConvertingMp3(false);
        setIsDownloadMenuOpen(false);
      }
    }, 100);
  };

  const startVideoRecording = async (mode: 'teaser' | 'full') => {
    if (!audioRef.current || !videoCanvasRef.current || !destRef.current) return;

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      alert("Video recording is not supported on this browser. Try Chrome or Firefox.");
      return;
    }

    setIsShareMenuOpen(false);
    setRecordingState('recording');
    setVideoMode(mode);

    // Stop current playback & Reset
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    // Setup MediaRecorder
    const canvasStream = videoCanvasRef.current.captureStream(30); // 30 FPS
    const audioStream = destRef.current.stream;

    // Combine tracks
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);

    try {
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps for decent quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Download Video
        const a = document.createElement('a');
        a.href = url;
        a.download = `Podvibe_${mode === 'teaser' ? 'Teaser' : 'Episode'}_${title.substring(0, 10)}.webm`;
        a.click();

        setRecordingState('done');
        setTimeout(() => setRecordingState('idle'), 3000);

        // Restore volume
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.muted = isMuted;
        }
      };

      videoRecorderRef.current = recorder;
      recorder.start();

      // Play audio
      audioRef.current.volume = 1; // Ensure volume for recording stream
      audioRef.current.play();

      if (mode === 'teaser') {
        setTimeout(() => {
          stopRecording();
        }, 15000); // Record 15 seconds for teaser
      }
      // For 'full', we wait for onEnded event in handleEnded

    } catch (e) {
      console.error("Failed to start MediaRecorder:", e);
      alert("Could not start recording. Your browser may not support the selected codec configuration.");
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
      videoRecorderRef.current.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleSocialShare = (platform: 'linkedin' | 'twitter' | 'facebook') => {
    const text = `Check out this AI-generated podcast about "${title}" on Podvibe! 🎙️`;
    const url = window.location.origin; // Use the current App URL

    let shareUrl = '';

    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=600');
    setIsShareMenuOpen(false);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    setIsSpeedMenuOpen(false);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (isGenerating) {
    return (
      <div className="w-full bg-slate-900 rounded-xl p-6 border border-slate-800 animate-pulse">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-brand-900/50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-brand-200 font-medium">Synthesizing Voice...</p>
        </div>
      </div>
    );
  }

  if (!audioPcm) {
    return (
      <div className="w-full bg-slate-900 rounded-xl p-8 border border-slate-800 text-center">
        <p className="text-slate-400 mb-4">Audio session expired or not generated.</p>
        <button
          onClick={onRegenerateAudio}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Regenerate Audio
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-visible">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Hidden Canvas for Video Recording (Square 1:1 for LinkedIn/Insta) */}
      <canvas
        ref={videoCanvasRef}
        width={1080}
        height={1080}
        className="hidden absolute pointer-events-none"
      />

      {/* Recording Overlay */}
      {recordingState === 'recording' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">{videoMode === 'teaser' ? 'Creating Social Teaser...' : 'Rendering Full Episode...'}</h3>
          <p className="text-slate-400 text-sm">
            {videoMode === 'teaser'
              ? 'Recording a 15s preview. Audio will play briefly.'
              : 'Recording entire episode. Please wait until audio finishes.'}
          </p>
        </div>
      )}

      {/* Success Overlay */}
      {recordingState === 'done' && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Video Ready!</h3>
          <p className="text-slate-400 text-sm mb-1">Downloaded to your device.</p>
          <p className="text-slate-500 text-xs">Upload this file to Instagram, TikTok or LinkedIn.</p>
        </div>
      )}

      {/* Converting MP3 Overlay */}
      {isConvertingMp3 && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-in fade-in duration-200">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-3" />
          <p className="text-white font-medium">Converting to MP3...</p>
        </div>
      )}

      <div className="relative z-10">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white line-clamp-1 pr-4 font-sans">{title}</h2>
            <p className="text-sm text-brand-400 font-medium">Deep Dive Episode</p>
          </div>
          <div className="flex gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${isDownloadMenuOpen ? 'text-brand-400 bg-brand-900/20' : 'text-slate-400 hover:text-brand-400 hover:bg-brand-900/20'}`}
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              {isDownloadMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 ring-1 ring-black/50">
                  <button
                    onClick={downloadWav}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span>Download WAV</span>
                    <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 rounded ml-auto">HQ</span>
                  </button>
                  <button
                    onClick={downloadMp3}
                    className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors border-t border-slate-700/50"
                  >
                    <FileAudio className="w-4 h-4 text-brand-400" />
                    <span>Download MP3</span>
                    <span className="text-[10px] bg-brand-900/30 text-brand-400 px-1.5 rounded ml-auto">MP3</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                className={`p-2 rounded-lg transition-colors ${isShareMenuOpen ? 'text-brand-400 bg-brand-900/20' : 'text-slate-400 hover:text-brand-400 hover:bg-brand-900/20'}`}
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Share Menu */}
              {isShareMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20 ring-1 ring-black/50">
                  <div className="p-2 border-b border-slate-700/50">
                    <span className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">Share Link</span>
                  </div>
                  <button
                    onClick={() => handleSocialShare('linkedin')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Linkedin className="w-4 h-4 text-[#0077b5]" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleSocialShare('twitter')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-white" />
                    X / Twitter
                  </button>
                  <button
                    onClick={() => handleSocialShare('facebook')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    Facebook
                  </button>

                  <div className="p-2 border-b border-t border-slate-700/50 mt-1">
                    <span className="text-xs font-semibold text-slate-500 px-2 uppercase tracking-wider">Post Media</span>
                  </div>

                  <button
                    onClick={() => startVideoRecording('teaser')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                    title="15s Preview Video"
                  >
                    <Instagram className="w-4 h-4 text-[#E4405F]" />
                    Download Video <span className="text-[10px] opacity-50 ml-auto">Teaser</span>
                  </button>
                  <button
                    onClick={() => startVideoRecording('full')}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-3 transition-colors"
                    title="Full Episode Video"
                  >
                    <Video className="w-4 h-4 text-brand-400" />
                    Download Video <span className="text-[10px] opacity-50 ml-auto">Full</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visualizer Area */}
        <div className="h-32 w-full bg-slate-900/50 rounded-xl mb-6 overflow-hidden relative border border-slate-800/50 flex items-center justify-center">
          <canvas ref={canvasRef} width={800} height={128} className="w-full h-full opacity-90" />
          {!isPlaying && currentTime === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
              <button onClick={togglePlay} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
                <span className="text-xs font-semibold text-white tracking-widest uppercase">Start Listening</span>
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-6 flex items-center group">
              <div className="absolute w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-3 h-3 bg-white rounded-full shadow pointer-events-none absolute transition-all opacity-0 group-hover:opacity-100"
                style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 6px)` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono w-10">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            {/* Transport Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => skip(-10)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                title="Rewind 10s"
              >
                <Rewind className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 flex items-center justify-center bg-white hover:bg-slate-200 text-slate-900 rounded-full transition-all shadow-lg active:scale-95"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <button
                onClick={() => skip(10)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full"
                title="Forward 10s"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                  className={`text-slate-400 hover:text-white p-2 rounded-full text-xs font-bold transition-colors ${isSpeedMenuOpen ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}
                  title="Playback Speed"
                >
                  {playbackRate}x
                </button>
                {isSpeedMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                    {[0.75, 1, 1.25, 1.5].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-slate-700 ${playbackRate === rate ? 'text-brand-400 font-bold bg-slate-700/50' : 'text-slate-300'}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : volume < 0.5 ? <Volume1 className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <div className="w-24 h-1.5 bg-slate-700 rounded-full relative overflow-visible flex items-center">
                  <div
                    className="h-full bg-brand-500 rounded-full absolute left-0 top-0"
                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                  />
                  {/* Visible Thumb */}
                  <div
                    className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-transform duration-100"
                    style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 6px)` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;