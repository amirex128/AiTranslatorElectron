import { app, ipcMain, clipboard, Menu, net } from 'electron';
import { createWindow, showWindow, minimizeWindow, closeWindow } from './main/window';
import { createTray } from './main/tray';
import { registerShortcuts, unregisterShortcuts } from './main/shortcuts';
import { checkAIProviderConnection } from './main/healthCheck';
import { aiTranslatorService } from './services/ai/AITranslatorService';
import { AIModel } from './models/AIModel';
import { APP_CONFIG } from './constants/appConfig';
import { databaseService } from './main/database/DatabaseService';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  // Remove default menu bar
  Menu.setApplicationMenu(null);
  
  createWindow();
  createTray();
  
  // Get mainWindow after it's created
  const windowModule = require('./main/window');
  if (windowModule.mainWindow) {
    registerShortcuts(windowModule.mainWindow);
  }

  // Health check on startup
  const isConnected = await checkAIProviderConnection(APP_CONFIG.aiProviderUrl);
  if (!isConnected) {
    console.warn('AI Provider is not available at', APP_CONFIG.aiProviderUrl);
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

app.on('will-quit', () => {
  unregisterShortcuts();
  databaseService.close();
});

// IPC Handlers - Register all handlers before app ready
ipcMain.handle('clipboard:read', () => {
  return clipboard.readText();
});

ipcMain.handle('clipboard:write', (_event, text: string) => {
  clipboard.writeText(text);
  return true;
});

ipcMain.handle('window:minimize', () => {
  minimizeWindow();
});

ipcMain.handle('window:close', () => {
  closeWindow();
});

ipcMain.handle('window:show', () => {
  showWindow();
});

ipcMain.handle('window:focus', () => {
  showWindow();
});

ipcMain.handle('ai-provider:check', (_event, url: string) => {
  return checkAIProviderConnection(url);
});

// Translation IPC Handlers
ipcMain.handle('translate:persian-to-english', async (_event, { text, model }) => {
  try {
    const result = await aiTranslatorService.translatePersianToEnglish(text, model as AIModel, {
      aiProviderUrl: APP_CONFIG.aiProviderUrl,
      temperature: APP_CONFIG.temperature,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('translate:english-to-persian', async (_event, { text, model }) => {
  try {
    const result = await aiTranslatorService.translateEnglishToPersian(text, model as AIModel, {
      aiProviderUrl: APP_CONFIG.aiProviderUrl,
      temperature: APP_CONFIG.temperature,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('translate:grammar', async (_event, { text, model }) => {
  try {
    const result = await aiTranslatorService.correctGrammar(text, model as AIModel, {
      aiProviderUrl: APP_CONFIG.aiProviderUrl,
      temperature: APP_CONFIG.temperature,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('tts:fetch-audio', async (_event, url: string) => {
  try {
    return await new Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>((resolve, reject) => {
      const request = net.request({
        method: 'GET',
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Origin': 'https://translate.google.com',
        },
      });

      const chunks: Buffer[] = [];

      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP error! status: ${response.statusCode}`));
          return;
        }

        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          const contentType = response.headers['content-type'];
          const mimeType = Array.isArray(contentType) ? contentType[0] : (contentType || 'audio/mpeg');
          resolve({ 
            success: true, 
            data: base64, 
            mimeType
          });
        });

        response.on('error', reject);
      });

      request.on('error', reject);
      request.end();
    });
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to fetch audio' };
  }
});

// Cache IPC Handlers
ipcMain.handle('cache:get', (_event, { model, userInput, systemTemplate }) => {
  try {
    const result = databaseService.getCache(model, userInput, systemTemplate);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cache:set', (_event, { model, userInput, systemTemplate, result }) => {
  try {
    databaseService.setCache(model, userInput, systemTemplate, result);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('cache:clear', () => {
  try {
    databaseService.clearCache();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// History IPC Handlers
ipcMain.handle('history:getAll', () => {
  try {
    const entries = databaseService.getAllHistory();
    return { success: true, data: entries };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history:add', (_event, entry) => {
  try {
    databaseService.addHistoryEntry(entry);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history:delete', (_event, id: string) => {
  try {
    databaseService.deleteHistoryEntry(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('history:clear', () => {
  try {
    databaseService.clearHistory();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
