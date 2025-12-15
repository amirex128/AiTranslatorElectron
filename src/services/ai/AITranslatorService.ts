import { AIModel } from '../../models/AIModel';
import {
  getPersianToEnglishPrompt,
  getEnglishToPersianPrompt,
  getGrammarCorrectionPrompt,
  getGrammarTeachingPrompt,
  getResponseSuggestionsPrompt,
} from './prompts';
import { AIChatService, AIChatServiceConfig } from './AIChatService';
import { AIChatOptions } from './types';
import { TranslatorOptions, TranslatorResponse } from '../../types/translation';
import { GrammarTeachingResult } from '../ai/AIChatService';
import { ResponseSuggestionsResult } from '../../types/responseSuggestions';
import { validateResponseSuggestionsResult } from '../../utils/validation';

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

  async teachGrammar(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<{ result: GrammarTeachingResult }> {
    const systemTemplate = getGrammarTeachingPrompt(text);

    const response = await this.chatService.chatForGrammarTeaching(
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

  async suggestResponses(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<{ result: ResponseSuggestionsResult }> {
    const systemTemplate = getResponseSuggestionsPrompt(text);

    // Use chatForGrammarTeaching method which doesn't validate as TranslationResult
    const response = await this.chatService.chatForGrammarTeaching(
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

    // Validate the response as ResponseSuggestionsResult
    const validatedResult = validateResponseSuggestionsResult(response.result);
    if (!validatedResult) {
      throw new Error('Invalid response format from AI service');
    }

    return {
      result: validatedResult,
    };
  }
}

// aiTranslatorService will be initialized with config in index.ts

