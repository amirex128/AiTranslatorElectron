import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { AIModel } from '../../../models/AIModel';
import { AITranslatorService } from '../../../services/ai/AITranslatorService';
import { handleIPC } from '../utils';

interface TranslationParams {
  text: string;
  model: AIModel;
}

/**
 * Registers translation IPC handlers
 * @param aiTranslatorService - The AI translator service instance
 */
export function registerTranslationHandlers(
  aiTranslatorService: AITranslatorService
): void {
  ipcMain.handle('translate:persian-to-english', handleIPC(async (_event: IpcMainInvokeEvent, { text, model }: TranslationParams) => {
    return await aiTranslatorService.translatePersianToEnglish(text, model, {});
  }));

  ipcMain.handle('translate:english-to-persian', handleIPC(async (_event: IpcMainInvokeEvent, { text, model }: TranslationParams) => {
    return await aiTranslatorService.translateEnglishToPersian(text, model, {});
  }));

  ipcMain.handle('translate:grammar', handleIPC(async (_event: IpcMainInvokeEvent, { text, model }: TranslationParams) => {
    return await aiTranslatorService.correctGrammar(text, model, {});
  }));

  ipcMain.handle('translate:grammar-teaching', handleIPC(async (_event: IpcMainInvokeEvent, { text, model }: TranslationParams) => {
    return await aiTranslatorService.teachGrammar(text, model, {});
  }));
}

