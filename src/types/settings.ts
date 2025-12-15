import { AIModel } from '../models/AIModel';

/**
 * Application settings interface
 * Centralized definition used across main process, renderer, and stores
 */
export interface AppSettings {
  selectedModel: AIModel;
  fallbackSelectedModel: AIModel;
  aiProviderUrl: string;
  openRouterBaseUrl: string;
  openRouterApiKey1: string;
  openRouterApiKey2: string;
  openRouterReferer: string;
  openRouterSiteName: string;
  temperature: number;
  fontSize: number;
  windowSize: { width: number; height: number };
  shortcuts: {
    persianToEnglish: string;
    englishToPersian: string;
    grammar: string;
    responseSuggestions: string;
    processMain: string;
    processFallback: string;
    processQuickTranslate: string;
    addBookmark: string;
  };
  quickTranslateEnabled: boolean;
  quickTranslateTimeout: number;
}

