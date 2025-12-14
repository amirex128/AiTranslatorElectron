import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { handleIPC } from '../utils';
import { windowsSpeechService } from '../../services/WindowsSpeechService';
import { mainWindow } from '../../window';

/**
 * Registers speech recognition IPC handlers
 */
export function registerSpeechHandlers(): void {
  // Set main window reference
  windowsSpeechService.setMainWindow(mainWindow);

  // Check if speech recognition is available
  ipcMain.handle('speech:isAvailable', handleIPC(async () => {
    return await windowsSpeechService.isAvailable();
  }));

  // Start speech recognition
  ipcMain.handle('speech:start', handleIPC(async () => {
    await windowsSpeechService.startRecognition();
    
    // Send status update to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('speech:status', { isListening: true });
    }
    
    return { success: true };
  }));

  // Stop speech recognition
  ipcMain.handle('speech:stop', handleIPC(async () => {
    await windowsSpeechService.stopRecognition();
    
    // Send status update to renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('speech:status', { isListening: false });
    }
    
    return { success: true };
  }));

  // Get current listening status
  ipcMain.handle('speech:getStatus', handleIPC(async () => {
    return { isListening: windowsSpeechService.getIsListening() };
  }));

  // Listen for speech recognition results from Windows
  // Note: Windows Speech Recognition types directly into the active window
  // We'll need to monitor clipboard or use a different approach
  // For now, we'll use a workaround where the user manually copies the text
  // or we can use Web Speech API as a fallback in the renderer
}

