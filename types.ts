
export type PodcastLength = 'Short' | 'Medium' | 'Long';
export type PodcastLanguage = 'English' | 'French' | 'FrenchCA' | 'Darija' | 'Arabic' | 'Spanish' | 'Chinese';

export interface ScriptLine {
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface SeriesHistory {
  title: string;
  summary: string;
  host1: string;
  host2: string;
  host1Role: string;
  host2Role: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  description: string;
  voice: string;
  avatar?: string;
  avatarType?: 'icon' | 'image';
  avatarValue?: string; // Icon name or Base64 image
  isCustom?: boolean;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 representation
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
  seriesHistory?: SeriesHistory[]; // Historical episodes data
  attachments?: FileAttachment[]; // New file support
  isTranscriptInAttachments?: boolean; // Toggle for transcript logic
  duration?: number; // Duration in minutes (1-20)
  host1Avatar?: string;
  host1AvatarType?: 'icon' | 'image';
  host2Avatar?: string;
  host2AvatarType?: 'icon' | 'image';
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
  host1Avatar?: string;
  host1AvatarType?: 'icon' | 'image';
  host2Avatar?: string;
  host2AvatarType?: 'icon' | 'image';
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
