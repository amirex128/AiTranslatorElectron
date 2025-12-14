// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

import { app, Menu } from 'electron';
import { createWindow, showWindow } from './main/window';
import { createTray } from './main/tray';
import { registerShortcuts, unregisterShortcuts } from './main/shortcuts';
import { checkAIProviderConnection } from './main/healthCheck';
import { APP_CONFIG } from './constants/appConfig';
import { databaseService } from './main/database/DatabaseService';
import { AIServiceFactory } from './main/services/AIServiceFactory';
import { registerAllIPCHandlers, registerTranslationIPCHandlers } from './main/ipc/ipcRouter';
import { AppSettings } from './types/settings';

// Initialize AI service factory
const aiServiceFactory = new AIServiceFactory();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Register IPC handlers before app ready
registerAllIPCHandlers();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  // Remove default menu bar
  Menu.setApplicationMenu(null);
  
  // Initialize AI services with settings from APP_CONFIG
  const settings = APP_CONFIG as AppSettings;
  const aiService = aiServiceFactory.createService(settings);
  
  // Register translation handlers now that service is available
  registerTranslationIPCHandlers(aiService);
  
  await createWindow();
  createTray();
  
  // Get mainWindow after it's created
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const windowModule = require('./main/window');
  if (windowModule.mainWindow) {
    registerShortcuts(windowModule.mainWindow);
  }

  // Health check on startup
  const isConnected = await checkAIProviderConnection(settings.aiProviderUrl);
  if (!isConnected) {
    console.warn('AI Provider is not available at', settings.aiProviderUrl);
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, keep running in tray
  }
});

app.on('activate', () => {
  showWindow();
});

app.on('will-quit', async () => {
  unregisterShortcuts();
  await databaseService.close();
});
