import { AIModel } from '../../models/AIModel';
import { TranslatorOptions, TranslatorResponse } from '../../types/translation';
import { GrammarTeachingResult } from '../ai/AIChatService';
import { ResponseSuggestionsResult } from '../../types/responseSuggestions';

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
      throw new Error('error' in response ? response.error : 'Translation failed');
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
      throw new Error('error' in response ? response.error : 'Translation failed');
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
      throw new Error('error' in response ? response.error : 'Grammar correction failed');
    }

    return response.data;
  }

  async teachGrammar(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<{ result: GrammarTeachingResult }> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateGrammarTeaching({
      text,
      model,
    });

    if (!response.success) {
      throw new Error('error' in response ? response.error : 'Grammar teaching failed');
    }

    return response.data;
  }

  async suggestResponses(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<{ result: ResponseSuggestionsResult }> {
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Electron API not available');
    }

    const response = await window.electronAPI.translateResponseSuggestions({
      text,
      model,
    });

    if (!response.success) {
      throw new Error('error' in response ? response.error : 'Response suggestions failed');
    }

    return response.data;
  }
}

export const aiTranslatorServiceIPC = new AITranslatorServiceIPC();

