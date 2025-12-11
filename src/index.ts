import { app, ipcMain, clipboard, Menu, net } from 'electron';
import { createWindow, showWindow, minimizeWindow, closeWindow } from './main/window';
import { createTray } from './main/tray';
import { registerShortcuts, unregisterShortcuts } from './main/shortcuts';
import { getSettings, setSettings } from './main/settings';
import { checkOllamaConnection } from './main/healthCheck';
import { aiTranslatorService } from './services/ai/AITranslatorService';
import { OllamaModel } from './models/OllamaModel';

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
  const settings = getSettings();
  const isConnected = await checkOllamaConnection(settings.ollamaUrl);
  if (!isConnected) {
    console.warn('Ollama is not available at', settings.ollamaUrl);
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

ipcMain.handle('settings:get', () => {
  return getSettings();
});

ipcMain.handle('settings:set', (_event, settings: any) => {
  setSettings(settings);
});

ipcMain.handle('ollama:check', (_event, url: string) => {
  return checkOllamaConnection(url);
});

// Translation IPC Handlers
ipcMain.handle('translate:persian-to-english', async (_event, { text, model, ollamaUrl, temperature }) => {
  try {
    const result = await aiTranslatorService.translatePersianToEnglish(text, model as OllamaModel, {
      ollamaUrl,
      temperature,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('translate:english-to-persian', async (_event, { text, model, ollamaUrl, temperature }) => {
  try {
    const result = await aiTranslatorService.translateEnglishToPersian(text, model as OllamaModel, {
      ollamaUrl,
      temperature,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('translate:grammar', async (_event, { text, model, ollamaUrl, temperature }) => {
  try {
    const result = await aiTranslatorService.correctGrammar(text, model as OllamaModel, {
      ollamaUrl,
      temperature,
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
          resolve({ 
            success: true, 
            data: base64, 
            mimeType: response.headers['content-type'] || 'audio/mpeg' 
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
