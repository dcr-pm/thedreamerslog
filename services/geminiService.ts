import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { DreamTags } from "../types";

const getGenAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found. Please select a key or check your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDreamImage = async (dreamText: string, tags?: DreamTags): Promise<string> => {
  const ai = getGenAI();

  // Build dreamer identity instructions for accurate representation
  let dreamerIdentity = '';
  let moodHint = '';
  if (tags) {
    const parts: string[] = [];
    if (tags.gender && tags.gender !== 'Prefer not to say') {
      parts.push(`The dreamer is ${tags.gender.toLowerCase()}`);
    }
    if (tags.ageRange) {
      parts.push(`age range: ${tags.ageRange}`);
    }
    if (parts.length > 0) {
      dreamerIdentity = `\nIMPORTANT - Dreamer identity: ${parts.join(', ')}. Any depiction of the dreamer or main character in the sketch MUST match this identity. Do NOT depict them as a different gender or age.`;
    }
    if (tags.mood.length > 0) {
      moodHint = `\nThe emotional tone of the dream: ${tags.mood.join(', ')}.`;
    }
  }

  const prompt = `Create a pencil sketch of this dream, with some scribbles. The style should be loose, like a drawing in a personal journal, leaving it open to interpretation. It can be a single scene or a collection of symbolic components based on the dream.
${dreamerIdentity}${moodHint}

Dream: "${dreamText}"
`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
  }
  throw new Error("Image generation failed");
};

export const analyzeDream = async (dreamText: string, tags?: DreamTags): Promise<string> => {
  const ai = getGenAI();

  let tagsContext = '';
  if (tags) {
    const parts: string[] = [];
    if (tags.gender && tags.gender !== 'Prefer not to say') parts.push(`The dreamer identifies as ${tags.gender}.`);
    if (tags.ageRange) parts.push(`The dreamer's age range: ${tags.ageRange}.`);
    if (tags.mood.length > 0) parts.push(`The mood(s) of the dream: ${tags.mood.join(', ')}.`);
    if (tags.theme.length > 0) parts.push(`The dream involved themes of: ${tags.theme.join(', ')}.`);
    if (tags.intensity) parts.push(`The dream intensity was ${tags.intensity}.`);
    if (tags.lucidity) parts.push(`Lucidity level: ${tags.lucidity}.`);
    if (tags.recurrence) parts.push(`Recurrence: ${tags.recurrence}.`);
    if (parts.length > 0) {
      tagsContext = `\nDreamer context: ${parts.join(' ')}\n`;
    }
  }

  const prompt = `Analyze the following dream from a psychological perspective using Jungian archetypes and common dream symbols.
${tagsContext}
FORMAT RULES (follow exactly):
- Use exactly three section headings, each on its own line: **Core Emotional Theme**, **Key Symbols & Archetypes**, **Potential Interpretation**
- Only these three headings should use **bold** markers. Do NOT bold any other text.
- Under "Key Symbols & Archetypes", list each symbol as a bullet point starting with "- " followed by the symbol name in plain text, a colon, then a SHORT one-sentence explanation. Example:
  - The Forest: Represents the unconscious mind and the unknown.
  - The Shadow Figure: Embodies repressed aspects of the self.
- "Core Emotional Theme" should be 1-2 sentences max.
- "Potential Interpretation" should be a concise paragraph, 3-4 sentences.
- Write in flowing paragraphs. Do not use sub-headings.
- Keep the total analysis under 180 words. Be concise and impactful.

Dream: "${dreamText}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });
  return response.text;
};

export const createDreamChat = (dreamText: string): Chat => {
  const ai = getGenAI();

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a dream analysis expert. The user has just had the following dream: "${dreamText}". They will now ask you follow-up questions about the symbols and themes in their dream. Provide insightful, concise answers based on psychological principles.`,
    },
  });
};