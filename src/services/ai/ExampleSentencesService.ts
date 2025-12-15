import { AIModel } from '../../models/AIModel';
import {
  getMainModelExamplePrompt,
  getFallbackModelExamplePrompt,
} from './prompts';
import { AIChatService, AIChatServiceConfig } from './AIChatService';
import { AIChatOptions } from './types';
import { TranslatorOptions } from '../../types/translation';
import { ExampleSentence } from '../../main/database/BookmarkService';

export class ExampleSentencesService {
  private config: AIChatServiceConfig;
  private chatService: AIChatService;

  constructor(config: AIChatServiceConfig) {
    this.config = config;
    this.chatService = new AIChatService(config);
  }

  async generateMainExamples(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<ExampleSentence[]> {
    const systemTemplate = getMainModelExamplePrompt(text);

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

    // Parse the JSON response
    try {
      // The AI should return {"examples": [...]} 
      // Since skipValidation is true, response.result should be the raw parsed JSON
      let parsed: any = null;
      
      if (typeof response.result === 'string') {
        try {
          parsed = JSON.parse(response.result);
        } catch (parseError) {
          console.error('[ExampleSentencesService] Failed to parse string result:', parseError);
          return [];
        }
      } else if (response.result && typeof response.result === 'object') {
        // Check if result already has examples field (direct format)
        if (response.result.examples && Array.isArray(response.result.examples)) {
          console.log('[ExampleSentencesService] Found examples directly in result:', response.result.examples.length);
          return response.result.examples as ExampleSentence[];
        }
        
        // Try to parse from persian_1 or english_1 field (AI might wrap JSON in these fields)
        if (response.result.persian_1 && typeof response.result.persian_1 === 'string') {
          try {
            parsed = JSON.parse(response.result.persian_1);
          } catch {
            // If persian_1 is not JSON, try english_1
            if (response.result.english_1 && typeof response.result.english_1 === 'string') {
              try {
                parsed = JSON.parse(response.result.english_1);
              } catch {
                console.warn('[ExampleSentencesService] Failed to parse english_1 as JSON');
                return [];
              }
            } else {
              console.warn('[ExampleSentencesService] No valid JSON string found in persian_1 or english_1');
              return [];
            }
          }
        } else if (response.result.english_1 && typeof response.result.english_1 === 'string') {
          try {
            parsed = JSON.parse(response.result.english_1);
          } catch {
            console.warn('[ExampleSentencesService] Failed to parse english_1 as JSON');
            return [];
          }
        } else {
          // If result is already an object but doesn't have examples, use it directly
          parsed = response.result;
        }
      } else {
        console.warn('[ExampleSentencesService] Unexpected response.result type:', typeof response.result);
        return [];
      }

      // Check if parsed object has examples
      if (parsed && parsed.examples && Array.isArray(parsed.examples)) {
        console.log('[ExampleSentencesService] Found examples in parsed object:', parsed.examples.length);
        return parsed.examples as ExampleSentence[];
      }

      // Fallback: if structure is different, log and return empty
      console.warn('[ExampleSentencesService] Unexpected response format. Parsed:', parsed);
      console.warn('[ExampleSentencesService] Response result:', response.result);
      return [];
    } catch (error) {
      console.error('[ExampleSentencesService] Error parsing examples:', error);
      console.error('[ExampleSentencesService] Response result:', response.result);
      return [];
    }
  }

  async generateFallbackExamples(
    text: string,
    model: AIModel,
    options: TranslatorOptions = {}
  ): Promise<ExampleSentence[]> {
    const systemTemplate = getFallbackModelExamplePrompt(text);

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

    // Parse the JSON response
    try {
      // The AI should return {"examples": [...]} 
      // Since skipValidation is true, response.result should be the raw parsed JSON
      let parsed: any = null;
      
      if (typeof response.result === 'string') {
        try {
          parsed = JSON.parse(response.result);
        } catch (parseError) {
          console.error('[ExampleSentencesService] Failed to parse string result:', parseError);
          return [];
        }
      } else if (response.result && typeof response.result === 'object') {
        // Check if result already has examples field (direct format)
        if (response.result.examples && Array.isArray(response.result.examples)) {
          console.log('[ExampleSentencesService] Found examples directly in result:', response.result.examples.length);
          return response.result.examples as ExampleSentence[];
        }
        
        // Try to parse from persian_1 or english_1 field (AI might wrap JSON in these fields)
        if (response.result.persian_1 && typeof response.result.persian_1 === 'string') {
          try {
            parsed = JSON.parse(response.result.persian_1);
          } catch {
            // If persian_1 is not JSON, try english_1
            if (response.result.english_1 && typeof response.result.english_1 === 'string') {
              try {
                parsed = JSON.parse(response.result.english_1);
              } catch {
                console.warn('[ExampleSentencesService] Failed to parse english_1 as JSON');
                return [];
              }
            } else {
              console.warn('[ExampleSentencesService] No valid JSON string found in persian_1 or english_1');
              return [];
            }
          }
        } else if (response.result.english_1 && typeof response.result.english_1 === 'string') {
          try {
            parsed = JSON.parse(response.result.english_1);
          } catch {
            console.warn('[ExampleSentencesService] Failed to parse english_1 as JSON');
            return [];
          }
        } else {
          // If result is already an object but doesn't have examples, use it directly
          parsed = response.result;
        }
      } else {
        console.warn('[ExampleSentencesService] Unexpected response.result type:', typeof response.result);
        return [];
      }

      // Check if parsed object has examples
      if (parsed && parsed.examples && Array.isArray(parsed.examples)) {
        console.log('[ExampleSentencesService] Found examples in parsed object:', parsed.examples.length);
        return parsed.examples as ExampleSentence[];
      }

      // Fallback: if structure is different, log and return empty
      console.warn('[ExampleSentencesService] Unexpected response format. Parsed:', parsed);
      console.warn('[ExampleSentencesService] Response result:', response.result);
      return [];
    } catch (error) {
      console.error('[ExampleSentencesService] Error parsing examples:', error);
      console.error('[ExampleSentencesService] Response result:', response.result);
      return [];
    }
  }
}

