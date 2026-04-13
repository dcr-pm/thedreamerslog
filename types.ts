
export enum AppState {
  IDLE,
  RECORDING,
  TYPING,
  ANALYZING,
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
  ageRange: string | null;
  mood: string[];
  theme: string[];
  intensity: string | null;
  lucidity: string | null;
  recurrence: string | null;
}

export const EMPTY_DREAM_TAGS: DreamTags = {
  gender: null,
  ageRange: null,
  mood: [],
  theme: [],
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
