export type PodcastLength = 'Short' | 'Medium' | 'Long';
export type PodcastLanguage = 'English' | 'French' | 'Darija';

export interface ScriptLine {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface PodcastSession {
  id: string;
  title: string;
  originalText: string;
  script: string;
  scriptLines: ScriptLine[];
  createdAt: number;
  duration?: number;
  length: PodcastLength;
  language: PodcastLanguage;
}

export interface SpeakerConfig {
  name: string;
  voice: 'Puck' | 'Kore' | 'Fenrir' | 'Charon' | 'Zephyr';
}

export interface GenerationState {
  status: 'idle' | 'generating_script' | 'generating_audio' | 'complete' | 'error';
  error?: string;
}

export interface AudioMetadata {
  blob: Blob;
  url: string;
}