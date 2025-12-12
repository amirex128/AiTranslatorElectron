import { AIModel } from '../../models/AIModel';
import { TranslationResult } from '../../utils/validation';
import {
  getPersianToEnglishPrompt,
  getEnglishToPersianPrompt,
  getGrammarCorrectionPrompt,
} from './prompts';
import { AIChatService, AIChatServiceConfig } from './AIChatService';
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

export class AITranslatorService {
  private config: AIChatServiceConfig;
  private chatService: AIChatService;

  constructor(config: AIChatServiceConfig) {
    this.config = config;
    this.chatService = new AIChatService(config);
  }

  async translatePersianToEnglish(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<TranslatorResponse> {
    const systemTemplate = getPersianToEnglishPrompt(text);

    const response = await this.chatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || this.config.aiProviderUrl,
        temperature: options.temperature ?? this.config.temperature,
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

    const response = await this.chatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || this.config.aiProviderUrl,
        temperature: options.temperature ?? this.config.temperature,
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

    const response = await this.chatService.chat(
      {
        systemTemplate,
        model,
        userInput: text,
        aiProviderUrl: options.aiProviderUrl || this.config.aiProviderUrl,
        temperature: options.temperature ?? this.config.temperature,
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

// aiTranslatorService will be initialized with config in index.ts

