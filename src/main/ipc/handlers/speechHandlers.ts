import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { handleIPC } from '../utils';
import { windowsSpeechService } from '../../services/WindowsSpeechService';
import { mainWindow } from '../../window';

/**
 * Registers speech recognition IPC handlers
 * Note: Windows Speech Service is only available on Windows
 * On Linux/macOS, these handlers will gracefully return false/unavailable
 */
export function registerSpeechHandlers(): void {
  // Set main window reference (only if on Windows)
  if (process.platform === 'win32') {
    windowsSpeechService.setMainWindow(mainWindow);
  }

  // Check if speech recognition is available
  ipcMain.handle('speech:isAvailable', handleIPC(async () => {
    // Windows Speech Service is only available on Windows
    if (process.platform !== 'win32') {
      console.log('[SpeechHandlers] Speech recognition not available on', process.platform);
      return false;
    }
    return await windowsSpeechService.isAvailable();
  }));

  // Start speech recognition
  ipcMain.handle('speech:start', handleIPC(async () => {
    // Windows Speech Service is only available on Windows
    if (process.platform !== 'win32') {
      console.warn('[SpeechHandlers] Cannot start speech recognition on', process.platform);
      return { success: false, error: 'Speech recognition is only available on Windows' };
    }

    try {
      await windowsSpeechService.startRecognition();
      
      // Send status update to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('speech:status', { isListening: true });
      }
      
      return { success: true };
    } catch (error) {
      console.error('[SpeechHandlers] Error starting speech recognition:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start speech recognition' 
      };
    }
  }));

  // Stop speech recognition
  ipcMain.handle('speech:stop', handleIPC(async () => {
    // Windows Speech Service is only available on Windows
    if (process.platform !== 'win32') {
      console.warn('[SpeechHandlers] Cannot stop speech recognition on', process.platform);
      return { success: false, error: 'Speech recognition is only available on Windows' };
    }

    try {
      await windowsSpeechService.stopRecognition();
      
      // Send status update to renderer
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('speech:status', { isListening: false });
      }
      
      return { success: true };
    } catch (error) {
      console.error('[SpeechHandlers] Error stopping speech recognition:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to stop speech recognition' 
      };
    }
  }));

  // Get current listening status
  ipcMain.handle('speech:getStatus', handleIPC(async () => {
    // Windows Speech Service is only available on Windows
    if (process.platform !== 'win32') {
      return { isListening: false };
    }
    return { isListening: windowsSpeechService.getIsListening() };
  }));

  // Listen for speech recognition results from Windows
  // Note: Windows Speech Recognition types directly into the active window
  // On Linux/macOS, users can use Web Speech API in the renderer as a fallback
}

