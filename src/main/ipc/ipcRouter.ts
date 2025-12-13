import { AITranslatorService } from '../../services/ai/AITranslatorService';
import { AppSettings } from '../../types/settings';
import { registerClipboardHandlers } from './handlers/clipboardHandlers';
import { registerWindowHandlers } from './handlers/windowHandlers';
import { registerTranslationHandlers } from './handlers/translationHandlers';
import { registerTTSHandlers } from './handlers/ttsHandlers';
import { registerCacheHandlers } from './handlers/cacheHandlers';
import { registerHistoryHandlers } from './handlers/historyHandlers';
import { registerSettingsHandlers } from './handlers/settingsHandlers';

/**
 * Registers all IPC handlers except translation handlers
 * Translation handlers are registered separately after AI service is created
 * @param getAIService - Function to get or create AI service instance
 * @param updateAIService - Function to update AI service with new settings
 */
export function registerAllIPCHandlers(
  getAIService: () => AITranslatorService | null,
  updateAIService: (settings: AppSettings) => void
): void {
  registerClipboardHandlers();
  registerWindowHandlers();
  registerTTSHandlers();
  registerCacheHandlers();
  registerHistoryHandlers();
  registerSettingsHandlers(getAIService, updateAIService);
}

/**
 * Registers translation IPC handlers
 * Should be called after AI service is created
 * @param aiService - The AI translator service instance
 */
export function registerTranslationIPCHandlers(aiService: AITranslatorService): void {
  registerTranslationHandlers(aiService);
}

