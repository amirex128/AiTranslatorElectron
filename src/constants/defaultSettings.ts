import { AppSettings } from '../types/settings';

/**
 * Default application settings
 * Reads from APP_CONFIG in main process, or from IPC in renderer process
 */
export async function getDefaultSettings(): Promise<AppSettings> {
  // Check if we're in main process (where APP_CONFIG is available)
  const isMainProcess = typeof process !== 'undefined' 
    && process.type !== 'renderer' 
    && typeof process.env !== 'undefined';
  
  if (isMainProcess) {
    // In main process, read directly from APP_CONFIG
    const { APP_CONFIG } = require('./appConfig');
    return {
      selectedModel: APP_CONFIG.selectedModel,
      fallbackSelectedModel: APP_CONFIG.fallbackSelectedModel,
      aiProviderUrl: APP_CONFIG.aiProviderUrl,
      openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
      openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
      openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
      openRouterReferer: APP_CONFIG.openRouterReferer,
      openRouterSiteName: APP_CONFIG.openRouterSiteName,
      temperature: APP_CONFIG.temperature,
      fontSize: APP_CONFIG.fontSize,
      windowSize: APP_CONFIG.windowSize,
      shortcuts: {
        persianToEnglish: APP_CONFIG.shortcuts.persianToEnglish,
        englishToPersian: APP_CONFIG.shortcuts.englishToPersian,
        grammar: APP_CONFIG.shortcuts.grammar,
        responseSuggestions: APP_CONFIG.shortcuts.responseSuggestions,
        processMain: APP_CONFIG.shortcuts.processMain,
        processFallback: APP_CONFIG.shortcuts.processFallback,
        processQuickTranslate: APP_CONFIG.shortcuts.processQuickTranslate,
        processDictionary: APP_CONFIG.shortcuts.processDictionary,
        addBookmark: APP_CONFIG.shortcuts.addBookmark,
      },
      quickTranslateEnabled: APP_CONFIG.quickTranslateEnabled,
      quickTranslateTimeout: APP_CONFIG.quickTranslateTimeout,
    };
  } else {
    // In renderer process, get settings from main process via IPC
    if (typeof window !== 'undefined' && window.electronAPI) {
      const response = await window.electronAPI.getSettings();
      if ('error' in response && response.error) {
        throw new Error(response.error);
      }
      if ('data' in response && response.data) {
        return response.data;
      }
      throw new Error('Failed to get settings from main process');
    }
    throw new Error('electronAPI is not available. This function should only be called in Electron renderer process.');
  }
}

