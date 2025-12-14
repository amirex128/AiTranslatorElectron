import { AITranslatorService } from '../../services/ai/AITranslatorService';
import { registerClipboardHandlers } from './handlers/clipboardHandlers';
import { registerWindowHandlers } from './handlers/windowHandlers';
import { registerTranslationHandlers } from './handlers/translationHandlers';
import { registerTTSHandlers } from './handlers/ttsHandlers';
import { registerHistoryHandlers } from './handlers/historyHandlers';
import { registerSettingsHandlers } from './handlers/settingsHandlers';
import { registerSpeechHandlers } from './handlers/speechHandlers';
import { registerQuickTranslateHandlers } from './handlers/quickTranslateHandlers';
import { registerBookmarkHandlers } from './handlers/bookmarkHandlers';

/**
 * Registers all IPC handlers except translation handlers
 * Translation handlers are registered separately after AI service is created
 */
export function registerAllIPCHandlers(): void {
  registerClipboardHandlers();
  registerWindowHandlers();
  registerTTSHandlers();
  registerHistoryHandlers();
  registerSettingsHandlers();
  registerSpeechHandlers();
  registerQuickTranslateHandlers();
  registerBookmarkHandlers();
}

/**
 * Registers translation IPC handlers
 * Should be called after AI service is created
 * @param aiService - The AI translator service instance
 */
export function registerTranslationIPCHandlers(aiService: AITranslatorService): void {
  registerTranslationHandlers(aiService);
}

