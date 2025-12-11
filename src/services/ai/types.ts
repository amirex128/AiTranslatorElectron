import { OllamaModel } from '../../models/OllamaModel';
import { TranslationResult } from '../../utils/validation';

export interface AIChatRequest {
  systemTemplate: string;
  model: OllamaModel;
  userInput: string;
  ollamaUrl?: string;
  temperature?: number;
}

export interface AIChatResponse {
  result: TranslationResult;
}

export interface AIChatOptions {
  timeout?: number;
  maxRetries?: number;
  abortSignal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

