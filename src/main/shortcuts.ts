import { globalShortcut, clipboard } from 'electron';
import { showWindow } from './window';
import { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

export const registerShortcuts = (window: BrowserWindow): void => {
  mainWindow = window;

  // Alt+Insert: Persian to English
  globalShortcut.register('Alt+Insert', () => {
    showWindow();
    const text = clipboard.readText();
    if (mainWindow) {
      mainWindow.webContents.send('shortcut', {
        type: 'persian-to-english',
        text,
      });
    }
  });

  // Alt+Home: English to Persian
  globalShortcut.register('Alt+Home', () => {
    showWindow();
    const text = clipboard.readText();
    if (mainWindow) {
      mainWindow.webContents.send('shortcut', {
        type: 'english-to-persian',
        text,
      });
    }
  });

  // Alt+PageUp: Grammar correction
  globalShortcut.register('Alt+PageUp', () => {
    showWindow();
    const text = clipboard.readText();
    if (mainWindow) {
      mainWindow.webContents.send('shortcut', {
        type: 'grammar',
        text,
      });
    }
  });
};

export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
};

