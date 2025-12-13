import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { settingsService } from '../../settings/SettingsService';
import { AppSettings } from '../../../types/settings';
import { AITranslatorService } from '../../../services/ai/AITranslatorService';
import { mainWindow } from '../../window';
import { handleIPC, handleIPCSync } from '../utils';

/**
 * Registers settings IPC handlers
 * @param getAIService - Function to get or create AI service instance
 * @param updateAIService - Function to update AI service with new settings
 */
export function registerSettingsHandlers(
  getAIService: () => AITranslatorService | null,
  updateAIService: (settings: AppSettings) => void
): void {
  ipcMain.handle('settings:get', handleIPC(async () => {
    return await settingsService.getSettings();
  }));

  ipcMain.handle('settings:update', handleIPC(async (_event: IpcMainInvokeEvent, partial: Partial<AppSettings>) => {
    await settingsService.updateSettings(partial);
    
    // Reinitialize AI services with new settings
    const updatedSettings = await settingsService.getSettings();
    updateAIService(updatedSettings);
    
    // If window size changed, update window
    if (partial.windowSize && mainWindow) {
      mainWindow.setSize(partial.windowSize.width, partial.windowSize.height);
    }
    
    // Notify renderer about settings change
    if (mainWindow) {
      mainWindow.webContents.send('settings:changed');
    }
  }));

  ipcMain.handle('settings:reset', handleIPC(async () => {
    await settingsService.resetToDefaults();
    
    // Reinitialize AI services with default settings
    const settings = await settingsService.getSettings();
    updateAIService(settings);
    
    // Update window size to default
    if (mainWindow) {
      mainWindow.setSize(settings.windowSize.width, settings.windowSize.height);
    }
    
    // Notify renderer about settings change
    if (mainWindow) {
      mainWindow.webContents.send('settings:changed');
    }
  }));

  ipcMain.handle('settings:getWindowSize', handleIPC(async () => {
    const settings = await settingsService.getSettings();
    return settings.windowSize;
  }));

  ipcMain.handle('settings:openPage', handleIPCSync(() => {
    if (mainWindow) {
      mainWindow.webContents.send('settings:openPage');
    }
  }));
}

