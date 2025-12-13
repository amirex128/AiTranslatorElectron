import { ipcMain, clipboard, IpcMainInvokeEvent } from 'electron';
import { handleIPCSync } from '../utils';

/**
 * Registers clipboard IPC handlers
 */
export function registerClipboardHandlers(): void {
  ipcMain.handle('clipboard:read', handleIPCSync(() => {
    return clipboard.readText();
  }));

  ipcMain.handle('clipboard:write', handleIPCSync((_event: IpcMainInvokeEvent, text: string) => {
    clipboard.writeText(text);
    return true;
  }));
}

