import { ipcMain } from 'electron';
import { handleIPC } from '../utils';
import { APP_CONFIG } from '../../../constants/appConfig';
import { AppSettings } from '../../../types/settings';

/**
 * Registers settings IPC handlers
 */
export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', handleIPC(async () => {
    // Return settings from APP_CONFIG (read from .env in main process)
    return APP_CONFIG as AppSettings;
  }));
}

