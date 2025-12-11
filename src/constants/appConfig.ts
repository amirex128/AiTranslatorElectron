import { AIModel } from '../models/AIModel';

export const APP_CONFIG = {
  // Model Selection
  selectedModel: AIModel.QWEN3_8B,
  
  // AI Provider Configuration
  aiProviderUrl: 'http://localhost:11434', // Ollama URL
  
  // OpenRouter Configuration
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  openRouterApiKey1: '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',
  openRouterApiKey2: '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',
  openRouterReferer: 'http://localhost:3000',
  openRouterSiteName: 'AI Translator',
  
  // AI Configuration
  temperature: 0.7,
  
  // UI Configuration
  fontSize: 16,
  windowSize: { width: 800, height: 600 },
} as const;

