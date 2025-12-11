import { AIModel } from '../../models/AIModel';
import { TranslationResult } from '../../utils/validation';
import { APP_CONFIG } from '../../constants/appConfig';
import {
  getPersianToEnglishPrompt,
  getEnglishToPersianPrompt,
  getGrammarCorrectionPrompt,
} from './prompts';
import { aiChatService } from './AIChatService';
import { AIChatOptions } from './types';

export interface TranslatorOptions {
  aiProviderUrl?: string;
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
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getPersianToEnglishPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || APP_CONFIG.aiProviderUrl,
        temperature: options.temperature ?? APP_CONFIG.temperature,
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
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getEnglishToPersianPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || APP_CONFIG.aiProviderUrl,
        temperature: options.temperature ?? APP_CONFIG.temperature,
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
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getGrammarCorrectionPrompt(text);

    const response = await aiChatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || APP_CONFIG.aiProviderUrl,
        temperature: options.temperature ?? APP_CONFIG.temperature,
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

