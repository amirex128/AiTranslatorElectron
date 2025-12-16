import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { fastDicService } from '../../../services/dictionary/FastDicService';
import { handleIPC } from '../utils';

/**
 * Registers dictionary IPC handlers
 */
export function registerDictionaryHandlers(): void {
  ipcMain.handle('dictionary:fetch', handleIPC(async (_event: IpcMainInvokeEvent, word: string) => {
    if (!word || typeof word !== 'string') {
      throw new Error('Word parameter is required');
    }

    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) {
      throw new Error('Word cannot be empty');
    }

    // Check if it's a single word (no spaces)
    if (trimmedWord.includes(' ')) {
      throw new Error('Dictionary lookup only works for single words');
    }

    console.log('[Dictionary] Fetching word:', trimmedWord);
    const result = await fastDicService.fetchWord(trimmedWord);
    return result;
  }));
}

