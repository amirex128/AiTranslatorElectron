import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { databaseService } from '../../database/DatabaseService';
import { TranslationResult } from '../../../utils/validation';
import { handleIPC } from '../utils';

interface CacheGetParams {
  model: string;
  userInput: string;
  systemTemplate: string;
}

interface CacheSetParams {
  model: string;
  userInput: string;
  systemTemplate: string;
  result: TranslationResult;
}

/**
 * Registers cache IPC handlers
 */
export function registerCacheHandlers(): void {
  ipcMain.handle('cache:get', handleIPC(async (_event: IpcMainInvokeEvent, { model, userInput, systemTemplate }: CacheGetParams) => {
    return await databaseService.getCache(model, userInput, systemTemplate);
  }));

  ipcMain.handle('cache:set', handleIPC(async (_event: IpcMainInvokeEvent, { model, userInput, systemTemplate, result }: CacheSetParams) => {
    await databaseService.setCache(model, userInput, systemTemplate, result);
  }));

  ipcMain.handle('cache:clear', handleIPC(async () => {
    await databaseService.clearCache();
  }));
}

