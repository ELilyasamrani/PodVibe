
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
  host1Role?: string;
  host2Role?: string;
  host1Description?: string;
  host2Description?: string;
  coverImage?: string;
  seriesContext?: string; // Additional context from a series
}

export interface PodcastSeries {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  createdAt: number;
  episodeIds: string[];
}

export interface PodcastSession {
  id: string;
  seriesId?: string; // Optional link to a series
  title: string;
  originalText: string;
  script: string;
  scriptLines: ScriptLine[];
  createdAt: number;
  duration?: number;
  length: PodcastLength;
  language: PodcastLanguage;
  summary?: string;
  // Customization
  customTitle?: string;
  customInstructions?: string;
  host1?: string;
  host2?: string;
  host1Voice?: string;
  host2Voice?: string;
  host1Role?: string;
  host2Role?: string;
  host1Description?: string;
  host2Description?: string;
  coverImage?: string;
  fullPrompt?: string; // The full system prompt used for generation
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
