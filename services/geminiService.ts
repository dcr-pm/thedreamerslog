import { GoogleGenAI, Modality, Chat } from "@google/genai";
import { DreamContext, DreamTags } from "../types";

const getGenAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key not found. Please select a key or check your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateDreamImage = async (dreamText: string, context: DreamContext): Promise<string> => {
  const ai = getGenAI();
  
  let contextPrompt = 'The dreamer provided this additional context:';
  if (context.emotion) contextPrompt += `\n- Primary emotion felt during the dream: ${context.emotion}`;
  if (context.wakingFeeling) contextPrompt += `\n- How they felt upon waking: ${context.wakingFeeling}`;
  if (context.conclusion) contextPrompt += `\n- The dream felt like it ${context.conclusion}.`;
  if (context.personDescription) contextPrompt += `\n- Description of a significant person in the dream: ${context.personDescription}. Please incorporate this description into the visual representation of any people present.`;
  if (context.additionalInfo) contextPrompt += `\n- Other details: ${context.additionalInfo}`;
    
  const prompt = `Create a pencil sketch of this dream, with some scribbles. The style should be loose, like a drawing in a personal journal, leaving it open to interpretation. It can be a single scene or a collection of symbolic components based on the dream.
  
Dream: "${dreamText}"

${context.emotion || context.wakingFeeling || context.conclusion || context.personDescription || context.additionalInfo ? contextPrompt : ''}
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
- Under "Key Symbols & Archetypes", list each symbol as a bullet point starting with "- " followed by the symbol name in plain text, a colon, then the explanation. Example:
  - The Forest: Represents the unconscious mind. Walking through a forest symbolizes...
  - The Shadow Figure: Embodies repressed aspects of the self...
- Write in flowing paragraphs for the other sections. Do not use sub-headings.
- Keep the total analysis under 300 words.

Dream: "${dreamText}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });
  return response.text;
};

export const createDreamChat = (dreamText: string, context: DreamContext | null): Chat => {
  const ai = getGenAI();
  
  let contextSystemInstruction = '';
  if (context) {
      let parts = [];
      if (context.emotion) parts.push(`Emotion felt was '${context.emotion}'`);
      if (context.wakingFeeling) parts.push(`waking feeling was '${context.wakingFeeling}'`);
      if (context.conclusion) parts.push(`the dream conclusion was '${context.conclusion}'`);
      if (context.personDescription) parts.push(`a person was described as '${context.personDescription}'`);
      if (context.additionalInfo) parts.push(`other details provided: '${context.additionalInfo}'`);
      
      if (parts.length > 0) {
        contextSystemInstruction = `The dreamer also provided the following context: ${parts.join(', ')}.`;
      }
  }

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a dream analysis expert. The user has just had the following dream: "${dreamText}". ${contextSystemInstruction} They will now ask you follow-up questions about the symbols and themes in their dream. Provide insightful, concise answers based on psychological principles.`,
    },
  });
};