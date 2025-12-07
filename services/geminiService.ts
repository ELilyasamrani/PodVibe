import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64 } from "../utils/audioUtils";
import { ScriptLine, PodcastLength, PodcastLanguage, PodcastOptions } from "../types";

interface CulturalConfig {
  defaultHost1: string;
  defaultHost2: string;
  voice1: string; // Gemini voice name
  voice2: string; // Gemini voice name
  context: string;
}

const CULTURAL_CONFIGS: Record<PodcastLanguage, CulturalConfig> = {
  'English': {
    defaultHost1: "Alex",
    defaultHost2: "Sarah",
    voice1: "Puck",
    voice2: "Kore",
    context: "Silicon Valley tech podcast vibe. Energetic, global, professional but accessible. Use metaphors from the US tech scene."
  },
  'French': {
    defaultHost1: "Thomas",
    defaultHost2: "Clara",
    voice1: "Fenrir",
    voice2: "Zephyr",
    context: "Parisian intellectual radio style (like France Inter). Thoughtful, articulate, slightly more formal but engaging. Use French cultural references and idioms."
  },
  'FrenchCA': {
    defaultHost1: "Jean-Luc",
    defaultHost2: "Marie-Claude",
    voice1: "Fenrir",
    voice2: "Zephyr",
    context: "Montreal tech scene vibe. Friendly, warm, using Quebecois idioms and expressions naturally. A mix of professional and casual ('tu' vs 'vous')."
  },
  'Darija': {
    defaultHost1: "Mohamed Amine",
    defaultHost2: "Ikhlas",
    voice1: "Charon",
    voice2: "Kore", 
    context: "A casual, energetic Moroccan tech talk (like GeeksBlabla). Speakers use Moroccan Darija (Arabic script) mixed with English/French technical terms (code-switching). They sound like friends chatting in a cafe in Casablanca. Use colloquialisms like 'Daba', 'Za3ma', 'Safi', 'Chouf', 'L3iba'. Tone: Insightful but fun and authentic."
  },
  'Arabic': {
    defaultHost1: "Ahmed",
    defaultHost2: "Fatima",
    voice1: "Zephyr",
    voice2: "Kore",
    context: "Modern Standard Arabic (Fusha), professional news/analysis style (like Al Jazeera podcasts). Clear, articulate, formal but engaging. Use precise terminology."
  },
  'Spanish': {
    defaultHost1: "Mateo",
    defaultHost2: "Valentina",
    voice1: "Puck",
    voice2: "Kore",
    context: "Madrid or Mexico City radio morning show. Fast-paced, passionate, energetic. Use clear Spanish with natural flow."
  },
  'Chinese': {
    defaultHost1: "Wei",
    defaultHost2: "Li",
    voice1: "Fenrir",
    voice2: "Zephyr",
    context: "Professional tech discussion in Mandarin. Respectful, insightful, modern. Focus on clarity and depth."
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
    case 'FrenchCA': return "The dialogue MUST be written in French (Canadian/Quebecois standard).";
    case 'Darija': return "The dialogue MUST be written in Moroccan Arabic (Darija) using Arabic script. It is CRITICAL to mix in English/French technical terms naturally (e.g. 'Software', 'Cloud', 'Update'). Do not translate technical terms to standard Arabic.";
    case 'Arabic': return "The dialogue MUST be written in Modern Standard Arabic.";
    case 'Spanish': return "The dialogue MUST be written in Spanish.";
    case 'Chinese': return "The dialogue MUST be written in Simplified Chinese.";
    default: return "The dialogue MUST be written in English.";
  }
};

export const generatePodcastScript = async (
  apiKey: string, 
  input: string, 
  length: PodcastLength, 
  language: PodcastLanguage,
  options?: PodcastOptions
): Promise<{ title: string; summary: string; script: string; lines: ScriptLine[]; usedHost1: string; usedHost2: string; prompt: string }> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = CULTURAL_CONFIGS[language];
  
  const host1 = options?.host1 || config.defaultHost1;
  const host2 = options?.host2 || config.defaultHost2;

  const isUrl = /^https?:\/\//i.test(input.trim());

  let prompt = `
    You are an expert podcast producer. 
    Task: Create a lively, engaging, deep-dive podcast dialogue between two hosts:
    1. ${host1} (Host): Curious, enthusiastic, guides the conversation.
    2. ${host2} (Expert): Analytical, insightful, provides deep context.
    
    Cultural Context: ${config.context}
  `;

  if (options?.customInstructions) {
    prompt += `
    Additional User Instructions: ${options.customInstructions}
    `;
  }

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
    - Keep it conversational, use natural fillers appropriate for the language.
    - The output MUST be a valid script format where every line starts with the speaker's name followed by a colon.
    ${options?.customTitle ? `- The title of the podcast is "${options.customTitle}".` : '- Provide a catchy title for this episode on the very first line starting with "TITLE: ".'}
    - Provide a 3-4 sentence summary of the discussion on the second line starting with "SUMMARY: ".
    - ${getLengthInstruction(length)}
    - ${getLanguageInstruction(language)}
    
    Output Format:
    TITLE: ${options?.customTitle || "[Catchy Title]"}
    SUMMARY: [A concise 3-4 sentence summary of the episode content]
    ${host1}: [Line]
    ${host2}: [Line]
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
  
  // Extract Metadata
  const titleMatch = rawText.match(/^TITLE:\s*(.*)/m);
  const title = titleMatch ? titleMatch[1].trim() : (options?.customTitle || "Deep Dive Episode");
  
  const summaryMatch = rawText.match(/^SUMMARY:\s*(.*)/m);
  const summary = summaryMatch ? summaryMatch[1].trim() : "No summary available.";

  // Clean up the script body by removing metadata lines
  const script = rawText
    .replace(/^TITLE:.*\n?/m, '')
    .replace(/^SUMMARY:.*\n?/m, '')
    .trim();

  // Parse lines
  const lines: ScriptLine[] = [];
  const rawLines = script.split('\n');
  
  for (const line of rawLines) {
    // Match "Speaker: Text" but handle potential spacing issues
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

  return { title, summary, script, lines, usedHost1: host1, usedHost2: host2, prompt };
};

export const generatePodcastAudio = async (
  apiKey: string, 
  script: string,
  language: PodcastLanguage,
  hosts: { host1: string, host2: string },
  voices?: { host1Voice?: string, host2Voice?: string }
): Promise<Int16Array> => {
  const ai = new GoogleGenAI({ apiKey });
  const config = CULTURAL_CONFIGS[language];

  // Use override voices if provided, otherwise default to cultural config
  const voice1Name = voices?.host1Voice || config.voice1;
  const voice2Name = voices?.host2Voice || config.voice2;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: hosts.host1,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1Name } } 
            },
            {
              speaker: hosts.host2,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2Name } }
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