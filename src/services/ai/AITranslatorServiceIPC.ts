import { OllamaModel } from '../../models/OllamaModel';
import { TranslationResult } from '../../utils/validation';

export interface TranslatorOptions {
  ollamaUrl?: string;
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
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translatePersianToEnglish({
      text,
      model,
      ollamaUrl: options.ollamaUrl,
      temperature: options.temperature,
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    return response.data;
  }

  async translateEnglishToPersian(
    text: string,
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateEnglishToPersian({
      text,
      model,
      ollamaUrl: options.ollamaUrl,
      temperature: options.temperature,
    });

    if (!response.success) {
      throw new Error(response.error || 'Translation failed');
    }

    return response.data;
  }

  async correctGrammar(
    text: string,
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateGrammar({
      text,
      model,
      ollamaUrl: options.ollamaUrl,
      temperature: options.temperature,
    });

    if (!response.success) {
      throw new Error(response.error || 'Grammar correction failed');
    }

    return response.data;
  }
}

export const aiTranslatorServiceIPC = new AITranslatorServiceIPC();

