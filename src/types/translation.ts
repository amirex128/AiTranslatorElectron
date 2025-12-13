import { TranslationResult } from '../utils/validation';

/**
 * Options for translation operations
 */
export interface TranslatorOptions {
  aiProviderUrl?: string;
  temperature?: number;
  abortSignal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

/**
 * Response from translation operations
 */
export interface TranslatorResponse {
  result: TranslationResult;
}

