import { AIModel } from '../../models/AIModel';
import { TranslationResult } from '../../utils/validation';

export interface TranslatorOptions {
  aiProviderUrl?: string;
  temperature?: number;
  abortSignal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export interface TranslatorResponse {
  result: TranslationResult;
}

class AITranslatorServiceIPC {
  async translatePersianToEnglish(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translatePersianToEnglish({
      text,
      model,
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    return response.data;
  }

  async translateEnglishToPersian(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateEnglishToPersian({
      text,
      model,
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    return response.data;
  }

  async correctGrammar(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateGrammar({
      text,
      model,
    });

    if (!response.success) {
      throw new Error(response.error || 'Grammar correction failed');
    }

    return response.data;
  }
}

export const aiTranslatorServiceIPC = new AITranslatorServiceIPC();

