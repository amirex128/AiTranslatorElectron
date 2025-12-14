import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { databaseService } from '../../database/DatabaseService';
import { AIModel } from '../../../models/AIModel';
import { TranslationResult } from '../../../utils/validation';
import { GrammarTeachingResult } from '../../../services/ai/AIChatService';
import { handleIPC } from '../utils';

interface HistoryEntry {
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching';
  model: AIModel;
  result: TranslationResult | null; // null for grammar-teaching
  grammarTeachingResult?: GrammarTeachingResult; // Only for grammar-teaching type
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
}

