import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { handleIPC } from '../utils';
import { quickTranslateService } from '../../../services/quickTranslate/QuickTranslateService';
import { quickTranslateCacheService } from '../../../services/quickTranslate/QuickTranslateCacheService';

interface GetCachedParams {
  englishText: string;
}

interface SaveCachedParams {
  englishText: string;
  persianTranslation: string;
}

interface TranslateParams {
  englishText: string;
}

/**
 * Registers quick translate IPC handlers
 */
export function registerQuickTranslateHandlers(): void {
  // Get cached translation
  ipcMain.handle('quick-translate:get-cached', handleIPC(async (_event: IpcMainInvokeEvent, params: GetCachedParams) => {
    const cached = await quickTranslateCacheService.getCached(params.englishText);
    return cached;
  }));

  // Save translation to cache
  ipcMain.handle('quick-translate:save-cached', handleIPC(async (_event: IpcMainInvokeEvent, params: SaveCachedParams) => {
    await quickTranslateCacheService.saveCache(params.englishText, params.persianTranslation);
    return true;
  }));

  // Translate text using Google Translate
  ipcMain.handle('quick-translate:translate', handleIPC(async (_event: IpcMainInvokeEvent, params: TranslateParams) => {
    // Check cache first
    const cached = await quickTranslateCacheService.getCached(params.englishText);
    if (cached) {
      return cached;
    }

    // Translate using Google Translate
    const translation = await quickTranslateService.translate(params.englishText);

    // Save to cache
    await quickTranslateCacheService.saveCache(params.englishText, translation);

    return translation;
  }));
}

