
export interface TranslationResult {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
}

export interface AppState {
  isCapturing: boolean;
  isCameraOn: boolean;
  history: TranslationResult[];
  lastError: string | null;
  currentTranslation: string;
  currentSentence: string;
  isProcessing: boolean;
}

export enum DetectionMode {
  SINGLE_FRAME = 'SINGLE_FRAME',
  CONTINUOUS = 'CONTINUOUS'
}
