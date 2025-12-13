import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { minimizeWindow, closeWindow, showWindow } from '../../window';
import { checkAIProviderConnection } from '../../healthCheck';
import { handleIPC, handleIPCSync } from '../utils';

/**
 * Registers window IPC handlers
 */
export function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', handleIPCSync(() => {
    minimizeWindow();
  }));

  ipcMain.handle('window:close', handleIPCSync(() => {
    closeWindow();
  }));

  ipcMain.handle('window:show', handleIPCSync(() => {
    showWindow();
  }));

  ipcMain.handle('window:focus', handleIPCSync(() => {
    showWindow();
  }));

  ipcMain.handle('ai-provider:check', handleIPC((_event: IpcMainInvokeEvent, url: string) => {
    return checkAIProviderConnection(url);
  }));
}

