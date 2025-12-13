import { AIModel } from '../models/AIModel';

// Check if we're in Node.js environment (main process) where process.env is available
const isNodeEnv = typeof process !== 'undefined' && process.env !== undefined;

// Helper function to get environment variable with fallback
const getEnv = (key: string, defaultValue: string): string => {
  if (!isNodeEnv) {
    return defaultValue;
  }
  return process.env[key] || defaultValue;
};

// Helper function to get number from environment variable with fallback
const getEnvNumber = (key: string, defaultValue: number): number => {
  if (!isNodeEnv) {
    return defaultValue;
  }
  const value = process.env[key];
  return value ? parseFloat(value) : defaultValue;
};

// Helper function to get AIModel from environment variable with fallback
const getEnvModel = (key: string, defaultValue: AIModel): AIModel => {
  if (!isNodeEnv) {
    return defaultValue;
  }
  const value = process.env[key];
  if (value && Object.values(AIModel).includes(value as AIModel)) {
    return value as AIModel;
  }
  return defaultValue;
};

export const APP_CONFIG = {
  // Model Selection
  selectedModel: getEnvModel('SELECTED_MODEL', AIModel.QWEN3_8B),
  
  // AI Provider Configuration
  aiProviderUrl: getEnv('AI_PROVIDER_URL', 'http://localhost:11434'), // Ollama URL
  
  // OpenRouter Configuration
  openRouterBaseUrl: getEnv('OPEN_ROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
  openRouterApiKey1: getEnv('OPEN_ROUTER_API_KEY_1', ''),
  openRouterApiKey2: getEnv('OPEN_ROUTER_API_KEY_2', ''),
  openRouterReferer: getEnv('OPEN_ROUTER_REFERER', 'http://localhost:3000'),
  openRouterSiteName: getEnv('OPEN_ROUTER_SITE_NAME', 'AI Translator'),
  
  // AI Configuration
  temperature: getEnvNumber('TEMPERATURE', 0.7),
  
  // UI Configuration
  fontSize: getEnvNumber('FONT_SIZE', 16),
  windowSize: { 
    width: getEnvNumber('WINDOW_WIDTH', 800), 
    height: getEnvNumber('WINDOW_HEIGHT', 600) 
  },
} as const;

