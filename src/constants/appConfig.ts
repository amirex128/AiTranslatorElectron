import { AIModel } from '../models/AIModel';

// Check if we're in Node.js environment (main process) where process.env is available
// In Electron, process.type is 'renderer' in renderer process and undefined in main process
// Also check if process.env is actually accessible
const isNodeEnv = typeof process !== 'undefined' 
  && process.type !== 'renderer' 
  && typeof process.env !== 'undefined';

// Helper function to get environment variable (required, no default)
const getEnv = (key: string): string => {
  if (!isNodeEnv) {
    throw new Error(`Environment variable ${key} is required but process.env is not available (renderer process). Make sure .env file is loaded in main process.`);
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set in .env file`);
  }
  return value;
};

// Helper function to get number from environment variable (required, no default)
const getEnvNumber = (key: string): number => {
  if (!isNodeEnv) {
    throw new Error(`Environment variable ${key} is required but process.env is not available (renderer process). Make sure .env file is loaded in main process.`);
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set in .env file`);
  }
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number, got: ${value}`);
  }
  return parsed;
};

// Helper function to get AIModel from environment variable (required, no default)
const getEnvModel = (key: string): AIModel => {
  if (!isNodeEnv) {
    throw new Error(`Environment variable ${key} is required but process.env is not available (renderer process). Make sure .env file is loaded in main process.`);
  }
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set in .env file`);
  }

  // First, check if the value is a direct enum value (e.g., 'google/gemma-3-27b-it:free')
  const enumValues = Object.values(AIModel) as string[];
  if (enumValues.includes(value)) {
    return value as AIModel;
  }
  
  // If not, check if it's an enum key name (e.g., 'GEMMA3_27B_IT_OPENROUTER1')
  // For string enums, Object.keys returns both keys and values
  // A value is a key if it exists in Object.keys but not in Object.values
  const enumKeys = Object.keys(AIModel);
  const enumKey = value as keyof typeof AIModel;
  
  // Check if value is a key (not a value)
  if (enumKeys.includes(value) && !enumValues.includes(value)) {
    // It's a key, get its corresponding enum value
    const enumValue = AIModel[enumKey];
    if (enumValue) {
      return enumValue;
    }
  }
  
  // If we get here, the value is neither a valid enum value nor a valid enum key
  throw new Error(
    `Invalid value for environment variable ${key}: "${value}". ` +
    `It must be either an enum key (e.g., GEMMA3_27B_IT_OPENROUTER1) or an enum value (e.g., google/gemma-3-27b-it:free)`
  );
};

// Helper function to get shortcut from environment variable (optional, with default)
const getEnvShortcut = (key: string, defaultValue: string): string => {
  if (!isNodeEnv) {
    return defaultValue;
  }
  const value = process.env[key];
  return value || defaultValue;
};

// Helper function to get boolean from environment variable (optional, with default)
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  if (!isNodeEnv) {
    return defaultValue;
  }
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
};

// Lazy initialization for APP_CONFIG
// This ensures that .env file is loaded before APP_CONFIG is accessed
let _appConfig: ReturnType<typeof createAppConfig> | null = null;

function createAppConfig() {
  if (!isNodeEnv) {
    // In renderer process, we can't read .env, so we'll use a placeholder
    // But this should never happen if the code is structured correctly
    // getDefaultSettings() should be used in renderer process instead
    throw new Error(
      'APP_CONFIG cannot be initialized in renderer process. ' +
      'Environment variables are only available in main process. ' +
      'Use getDefaultSettings() from defaultSettings.ts in renderer process instead.'
    );
  }
  
  return {
  // Model Selection
    selectedModel: getEnvModel('SELECTED_MODEL'),
    fallbackSelectedModel: getEnvModel('FALLBACK_SELECTED_MODEL'),
  
  // AI Provider Configuration
    aiProviderUrl: getEnv('AI_PROVIDER_URL'), // Ollama URL
  
  // OpenRouter Configuration
    openRouterBaseUrl: getEnv('OPEN_ROUTER_BASE_URL'),
    openRouterApiKey1: getEnv('OPEN_ROUTER_API_KEY_1'),
    openRouterApiKey2: getEnv('OPEN_ROUTER_API_KEY_2'),
    openRouterReferer: getEnv('OPEN_ROUTER_REFERER'),
    openRouterSiteName: getEnv('OPEN_ROUTER_SITE_NAME'),
  
  // AI Configuration
    temperature: getEnvNumber('TEMPERATURE'),
  
  // UI Configuration
    fontSize: getEnvNumber('FONT_SIZE'),
    windowSize: { 
      width: getEnvNumber('WINDOW_WIDTH'), 
      height: getEnvNumber('WINDOW_HEIGHT') 
    },
  
  // Keyboard Shortcuts
    shortcuts: {
      persianToEnglish: getEnvShortcut('SHORTCUT_PERSIAN_TO_ENGLISH', 'Alt+Insert'),
      englishToPersian: getEnvShortcut('SHORTCUT_ENGLISH_TO_PERSIAN', 'Alt+Home'),
      grammar: getEnvShortcut('SHORTCUT_GRAMMAR', 'Alt+PageUp'),
      responseSuggestions: getEnvShortcut('SHORTCUT_RESPONSE_SUGGESTIONS', 'Alt+PageDown'),
      processMain: getEnvShortcut('SHORTCUT_PROCESS_MAIN', 'CommandOrControl+Enter'),
      processFallback: getEnvShortcut('SHORTCUT_PROCESS_FALLBACK', 'Alt+Enter'),
      processQuickTranslate: getEnvShortcut('SHORTCUT_PROCESS_QUICK_TRANSLATE', 'Alt+Shift+Enter'),
    },
  
  // Quick Translate Configuration
    quickTranslateEnabled: getEnvBoolean('QUICK_TRANSLATE_ENABLED', true),
    quickTranslateTimeout: getEnvNumber('QUICK_TRANSLATE_TIMEOUT'),
} as const;
}

// Create APP_CONFIG only in main process
// In renderer process, this will throw an error at module load time
// This is intentional - APP_CONFIG should only be used in main process
// For renderer process, use getDefaultSettings() which handles this gracefully
// Using lazy initialization to ensure .env is loaded before accessing
// Using Proxy to defer initialization until first property access
export const APP_CONFIG = new Proxy({} as ReturnType<typeof createAppConfig>, {
  get(target, prop) {
    if (!_appConfig) {
      _appConfig = createAppConfig();
    }
    const value = _appConfig[prop as keyof typeof _appConfig];
    return value;
  },
  ownKeys() {
    if (!_appConfig) {
      _appConfig = createAppConfig();
    }
    return Reflect.ownKeys(_appConfig);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (!_appConfig) {
      _appConfig = createAppConfig();
    }
    return Reflect.getOwnPropertyDescriptor(_appConfig, prop);
  },
  has(target, prop) {
    if (!_appConfig) {
      _appConfig = createAppConfig();
    }
    return prop in _appConfig;
  },
});

