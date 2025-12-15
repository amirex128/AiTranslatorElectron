import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { minimizeWindow, maximizeWindow, restoreWindow, closeWindow, showWindow, mainWindow } from '../../window';
import { checkAIProviderConnection } from '../../healthCheck';
import { handleIPC, handleIPCSync } from '../utils';

/**
 * Registers window IPC handlers
 */
export function registerWindowHandlers(): void {
  ipcMain.handle('window:minimize', handleIPCSync(() => {
    minimizeWindow();
  }));

  ipcMain.handle('window:maximize', handleIPCSync(() => {
    maximizeWindow();
  }));

  ipcMain.handle('window:restore', handleIPCSync(() => {
    restoreWindow();
  }));

  ipcMain.handle('window:isMaximized', handleIPCSync(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.isMaximized();
    }
    return false;
  }));

  ipcMain.handle('window:close', handleIPCSync(() => {
    closeWindow();
  }));

  ipcMain.handle('window:show', handleIPC(async () => {
    await showWindow();
  }));

  ipcMain.handle('window:focus', handleIPC(async () => {
    await showWindow();
  }));

  ipcMain.handle('ai-provider:check', handleIPC((_event: IpcMainInvokeEvent, url: string) => {
    return checkAIProviderConnection(url);
  }));

  ipcMain.handle('window:openDevTools', handleIPCSync(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.openDevTools();
    }
  }));
}

