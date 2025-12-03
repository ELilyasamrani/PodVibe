import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64 } from "../utils/audioUtils";
import { ScriptLine, PodcastLength, PodcastLanguage } from "../types";

interface CulturalConfig {
  host1: string;
  host2: string;
  voice1: string; // Gemini voice name
  voice2: string; // Gemini voice name
  context: string;
}

const CULTURAL_CONFIGS: Record<PodcastLanguage, CulturalConfig> = {
  'English': {
    host1: "Alex",
    host2: "Sarah",
    voice1: "Puck",
    voice2: "Kore",
    context: "Silicon Valley tech podcast vibe. Energetic, global, professional but accessible. Use metaphors from the US tech scene."
  },
  'French': {
    host1: "Thomas",
    host2: "Clara",
    voice1: "Fenrir",
    voice2: "Zephyr",
    context: "Parisian intellectual radio style (like France Inter). Thoughtful, articulate, slightly more formal but engaging. Use French cultural references and idioms."
  },
  'Darija': {
    host1: "Youssef",
    host2: "Layla",
    voice1: "Charon",
    voice2: "Kore", 
    context: "A casual, energetic Moroccan tech talk (like GeeksBlabla). Speakers use Moroccan Darija (Arabic script) mixed with English/French technical terms (code-switching). They sound like friends chatting in a cafe in Casablanca. Use colloquialisms like 'Daba', 'Za3ma', 'Safi', 'Chouf', 'L3iba'. Tone: Insightful but fun and authentic."
  }
};

const getLengthInstruction = (length: PodcastLength) => {
  switch (length) {
    case 'Short': return "Keep the conversation brief and concise, around 2-3 minutes long.";
    case 'Medium': return "Keep the conversation standard length, around 5 minutes long.";
    case 'Long': return "Create an in-depth, detailed discussion, around 10-12 minutes long.";
    default: return "Keep the conversation around 5 minutes long.";
  }
};

const getLanguageInstruction = (lang: PodcastLanguage) => {
  switch (lang) {
    case 'French': return "The dialogue MUST be written in French.";
    case 'Darija': return "The dialogue MUST be written in Moroccan Arabic (Darija) using Arabic script. It is CRITICAL to mix in English/French technical terms naturally (e.g. 'Software', 'Cloud', 'Update'). Do not translate technical terms to standard Arabic.";
    default: return "The dialogue MUST be written in English.";
  }
};

export const generatePodcastScript = async (
  apiKey: string, 
  input: string, 
  length: PodcastLength, 
  language: PodcastLanguage
): Promise<{ title: string; script: string; lines: ScriptLine[] }> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = CULTURAL_CONFIGS[language];
  
  const isUrl = /^https?:\/\//i.test(input.trim());

  let prompt = `
    You are an expert podcast producer. 
    Task: Create a lively, engaging, deep-dive podcast dialogue between two hosts:
    1. ${config.host1} (Host): Curious, enthusiastic, guides the conversation.
    2. ${config.host2} (Expert): Analytical, insightful, provides deep context.
    
    Cultural Context: ${config.context}
  `;

  if (isUrl) {
    prompt += `
    Source Material: Please analyze the content at the following URL: "${input.trim()}". 
    If you cannot access the full text of the specific post, use the search tool to find the general context, recent articles, or discussions by the author/topic in the link to form the basis of the podcast.
    `;
  } else {
    prompt += `
    Source Material: "${input}"
    `;
  }
    
  prompt += `
    Guidelines:
    - Keep it conversational, use natural fillers appropriate for the language (e.g., "Right", "Exactly" for English; "C'est ça", "Effectivement" for French; "Wayyeh", "Fehal hakka" for Darija).
    - The output MUST be a valid script format where every line starts with the speaker's name followed by a colon.
    - Also provide a catchy title for this episode on the very first line starting with "TITLE: ".
    - ${getLengthInstruction(length)}
    - ${getLanguageInstruction(language)}
    
    Output Format:
    TITLE: [Catchy Title]
    ${config.host1}: [Line]
    ${config.host2}: [Line]
    ...
  `;

  const requestConfig: any = {
    temperature: 0.7,
  };

  // Enable search if it looks like a URL
  if (isUrl) {
    requestConfig.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: requestConfig
  });

  const rawText = response.text || "";
  const titleMatch = rawText.match(/^TITLE:\s*(.*)/m);
  const title = titleMatch ? titleMatch[1].trim() : "Deep Dive Episode";
  
  // Clean up the title line from the script body
  const script = rawText.replace(/^TITLE:.*\n?/, '').trim();

  // Parse lines
  const lines: ScriptLine[] = [];
  const rawLines = script.split('\n');
  
  for (const line of rawLines) {
    const match = line.match(/^([^:]+):\s*(.*)/);
    if (match) {
      lines.push({
        speaker: match[1].trim(),
        text: match[2].trim(),
        startTime: 0,
        endTime: 0
      });
    }
  }

  return { title, script, lines };
};

export const generatePodcastAudio = async (
  apiKey: string, 
  script: string,
  language: PodcastLanguage
): Promise<Int16Array> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = CULTURAL_CONFIGS[language];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: config.host1,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice1 } } 
            },
            {
              speaker: config.host2,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice2 } }
            }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("No audio data returned from Gemini.");
  }

  const uint8Array = decodeBase64(base64Audio);
  return new Int16Array(uint8Array.buffer);
};

export const estimateTimestamps = (lines: ScriptLine[], totalDuration: number): ScriptLine[] => {
  // Simple estimation based on character count
  // This isn't perfect but provides a reasonable approximation for visual tracking
  const totalChars = lines.reduce((acc, line) => acc + line.text.length, 0);
  
  let currentTime = 0;
  
  return lines.map(line => {
    const lineDuration = (line.text.length / totalChars) * totalDuration;
    const startTime = currentTime;
    const endTime = currentTime + lineDuration;
    currentTime = endTime;
    
    return {
      ...line,
      startTime,
      endTime
    };
  });
};