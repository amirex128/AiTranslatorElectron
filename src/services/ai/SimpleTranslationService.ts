import { AIModel } from '../../models/AIModel';
import {
  getSimpleEnglishToPersianPrompt,
  getSimplePersianToEnglishPrompt,
} from './prompts';
import { AIChatService, AIChatServiceConfig } from './AIChatService';
import { AIChatOptions } from './types';
import { TranslatorOptions } from '../../types/translation';

export interface SimpleTranslationResult {
  persian?: string;
  english?: string;
}

export class SimpleTranslationService {
  private config: AIChatServiceConfig;
  private chatService: AIChatService;

  constructor(config: AIChatServiceConfig) {
    this.config = config;
    this.chatService = new AIChatService(config);
  }

  async translateEnglishToPersian(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<SimpleTranslationResult> {
    const systemTemplate = getSimpleEnglishToPersianPrompt(text);

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
        skipValidation: true,
      }
    );

    // Parse the simple JSON response
    // The AI should return {"persian": "..."} but it might be wrapped in the standard format
    try {
      // First, try to parse the result as JSON (if it's a string)
      let parsed: any;
      if (typeof response.result === 'string') {
        parsed = JSON.parse(response.result);
      } else if (response.result && typeof response.result === 'object') {
        // If result is already an object, check if it has persian field
        if (response.result.persian) {
          return { persian: response.result.persian };
        }
        // Try to parse english_1 as JSON string
        if (response.result.english_1) {
          parsed = JSON.parse(response.result.english_1);
        } else {
          // Fallback: use persian_1 if available
          return { persian: response.result.persian_1 || '' };
        }
      } else {
        return { persian: '' };
      }
      
      if (parsed && parsed.persian) {
        return { persian: parsed.persian };
      }
      
      // Fallback: if the response doesn't match expected format, try to extract from the result
      return { persian: response.result.persian_1 || response.result.english_1 || '' };
    } catch (error) {
      console.error('[SimpleTranslationService] Error parsing translation result:', error);
      // Fallback: return the first persian translation if available
      if (response.result && typeof response.result === 'object') {
        return { persian: response.result.persian_1 || response.result.english_1 || '' };
      }
      return { persian: '' };
    }
  }

  async translatePersianToEnglish(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<SimpleTranslationResult> {
    const systemTemplate = getSimplePersianToEnglishPrompt(text);

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
        skipValidation: true,
      }
    );

    // Parse the simple JSON response
    // The AI should return {"english": "..."} but it might be wrapped in the standard format
    try {
      // First, try to parse the result as JSON (if it's a string)
      let parsed: any;
      if (typeof response.result === 'string') {
        parsed = JSON.parse(response.result);
      } else if (response.result && typeof response.result === 'object') {
        // If result is already an object, check if it has english field
        if (response.result.english) {
          return { english: response.result.english };
        }
        // Try to parse persian_1 as JSON string
        if (response.result.persian_1) {
          parsed = JSON.parse(response.result.persian_1);
        } else {
          // Fallback: use english_1 if available
          return { english: response.result.english_1 || '' };
        }
      } else {
        return { english: '' };
      }
      
      if (parsed && parsed.english) {
        return { english: parsed.english };
      }
      
      // Fallback: if the response doesn't match expected format, try to extract from the result
      return { english: response.result.english_1 || response.result.persian_1 || '' };
    } catch (error) {
      console.error('[SimpleTranslationService] Error parsing translation result:', error);
      // Fallback: return the first english translation if available
      if (response.result && typeof response.result === 'object') {
        return { english: response.result.english_1 || response.result.persian_1 || '' };
      }
      return { english: '' };
    }
  }
}

