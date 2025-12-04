export type PodcastLength = 'Short' | 'Medium' | 'Long';
export type PodcastLanguage = 'English' | 'French' | 'FrenchCA' | 'Darija' | 'Arabic' | 'Spanish' | 'Chinese';

export interface ScriptLine {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface PodcastOptions {
  customTitle?: string;
  customInstructions?: string;
  host1?: string;
  host2?: string;
  host1Voice?: string;
  host2Voice?: string;
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
  // Customization
  customTitle?: string;
  customInstructions?: string;
  host1?: string;
  host2?: string;
  host1Voice?: string;
  host2Voice?: string;
  // Optional persisted audio (base64 data URL). May be omitted for long episodes.
  audioBase64?: string;
  // Raw audio size in bytes (useful to decide whether audio was persisted)
  audioSize?: number;
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