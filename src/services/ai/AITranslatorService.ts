import { OllamaModel } from '../../models/OllamaModel';
import { TranslationResult } from '../../utils/validation';
import {
  getPersianToEnglishPrompt,
  getEnglishToPersianPrompt,
  getGrammarCorrectionPrompt,
} from './prompts';
import { aiChatService } from './AIChatService';
import { AIChatOptions } from './types';

export interface TranslatorOptions {
  ollamaUrl?: string;
  temperature?: number;
  abortSignal?: AbortSignal;
  onProgress?: (progress: number) => void;
}

export interface TranslatorResponse {
  result: TranslationResult;
}

class AITranslatorService {
  async translatePersianToEnglish(
    text: string,
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getPersianToEnglishPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        ollamaUrl: options.ollamaUrl,
        temperature: options.temperature,
      },
      {
        abortSignal: options.abortSignal,
        onProgress: options.onProgress,
      }
    );

    return {
      result: response.result,
    };
  }

  async translateEnglishToPersian(
    text: string,
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getEnglishToPersianPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        ollamaUrl: options.ollamaUrl,
        temperature: options.temperature,
      },
      {
        abortSignal: options.abortSignal,
        onProgress: options.onProgress,
      }
    );

    return {
      result: response.result,
    };
  }

  async correctGrammar(
    text: string,
    model: OllamaModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getGrammarCorrectionPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        ollamaUrl: options.ollamaUrl,
        temperature: options.temperature,
      },
      {
        abortSignal: options.abortSignal,
        onProgress: options.onProgress,
      }
    );

    return {
      result: response.result,
    };
  }
}

export const aiTranslatorService = new AITranslatorService();

