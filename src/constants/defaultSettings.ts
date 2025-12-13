import { AppSettings } from '../types/settings';
import { APP_CONFIG } from './appConfig';

/**
 * Default application settings
 * Centralized source of truth for default values
 */
export function getDefaultSettings(): AppSettings {
  return {
    selectedModel: APP_CONFIG.selectedModel,
    aiProviderUrl: APP_CONFIG.aiProviderUrl,
    openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
    openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
    openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
    openRouterReferer: APP_CONFIG.openRouterReferer,
    openRouterSiteName: APP_CONFIG.openRouterSiteName,
    temperature: APP_CONFIG.temperature,
    fontSize: APP_CONFIG.fontSize,
    windowSize: APP_CONFIG.windowSize,
  };
}

