
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

export interface DreamContext {
  emotion: string;
  wakingFeeling: string;
  conclusion: string;
  personDescription: string;
  additionalInfo: string;
}
