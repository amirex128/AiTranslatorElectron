import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import { databaseService } from '../../database/DatabaseService';
import { AIModel } from '../../../models/AIModel';
import { TranslationResult } from '../../../utils/validation';
import { GrammarTeachingResult } from '../../../services/ai/AIChatService';
import { ResponseSuggestionsResult } from '../../../types/responseSuggestions';
import { handleIPC } from '../utils';
import { mainWindow } from '../../window';

interface HistoryEntry {
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
  model: AIModel;
  result: TranslationResult | null; // null for grammar-teaching and response-suggestions
  grammarTeachingResult?: GrammarTeachingResult; // Only for grammar-teaching type
  responseSuggestionsResult?: ResponseSuggestionsResult; // Only for response-suggestions type
  responseTime?: number;
}

/**
 * Registers history IPC handlers
 */
export function registerHistoryHandlers(): void {
  ipcMain.handle('history:getAll', handleIPC(async () => {
    return await databaseService.getAllHistory();
  }));

  ipcMain.handle('history:add', handleIPC(async (_event: IpcMainInvokeEvent, entry: HistoryEntry) => {
    await databaseService.addHistoryEntry(entry);
  }));

  ipcMain.handle('history:delete', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    await databaseService.deleteHistoryEntry(id);
  }));

  ipcMain.handle('history:clear', handleIPC(async () => {
    await databaseService.clearHistory();
  }));

  ipcMain.handle('history:clearWithConfirmation', handleIPC(async (_event: IpcMainInvokeEvent) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error('Window is not available');
    }
    
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['بله', 'خیر'],
      defaultId: 1,
      title: 'پاکسازی کش',
      message: 'آیا مطمئن هستید که می‌خواهید تمام کش (تاریخچه) را پاک کنید؟',
      cancelId: 1,
    });
    
    if (result.response === 0) {
      await databaseService.clearHistory();
      // Notify renderer to reload history
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('history:cleared');
      }
      return { confirmed: true };
    }
    
    return { confirmed: false };
  }));
}

