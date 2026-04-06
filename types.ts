
export enum AppState {
  IDLE,
  RECORDING,
  TYPING,
  ANALYZING_INTERPRETATION,
  AWAITING_CONTEXT,
  ANALYZING_VISUAL,
  COMPLETE,
}

export interface DreamAnalysisData {
  imageUrl: string;
  interpretation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DreamTags {
  gender: string | null;
  mood: string | null;
  theme: string | null;
  intensity: string | null;
  lucidity: string | null;
  recurrence: string | null;
}

export const EMPTY_DREAM_TAGS: DreamTags = {
  gender: null,
  mood: null,
  theme: null,
  intensity: null,
  lucidity: null,
  recurrence: null,
};

export interface DreamContext {
  emotion: string;
  wakingFeeling: string;
  conclusion: string;
  personDescription: string;
  additionalInfo: string;
}
