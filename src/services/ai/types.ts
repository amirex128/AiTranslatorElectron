import { AIModel } from '../../models/AIModel';
import { TranslationResult } from '../../utils/validation';

export interface AIChatRequest {
  systemTemplate: string;
  model: AIModel;
  userInput: string;
  aiProviderUrl?: string;
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
  skipValidation?: boolean;
}

