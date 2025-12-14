import { globalShortcut, clipboard, BrowserWindow } from 'electron';
import { showWindow } from './window';

let mainWindow: BrowserWindow | null = null;

interface ShortcutsConfig {
  persianToEnglish: string;
  englishToPersian: string;
  grammar: string;
  responseSuggestions: string;
}

const registerShortcut = (accelerator: string, type: string): boolean => {
  try {
    const success = globalShortcut.register(accelerator, () => {
      showWindow();
      const text = clipboard.readText();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('shortcut', {
          type,
          text,
        });
      }
    });
    
    if (!success) {
      console.error(`[Shortcuts] Failed to register shortcut: ${accelerator}`);
      return false;
    }
    
    console.log(`[Shortcuts] Registered shortcut: ${accelerator} -> ${type}`);
    return true;
  } catch (error) {
    console.error(`[Shortcuts] Error registering shortcut ${accelerator}:`, error);
    return false;
  }
};

export const registerShortcuts = (window: BrowserWindow, shortcuts: ShortcutsConfig): void => {
  mainWindow = window;

  // Unregister all existing shortcuts first
  globalShortcut.unregisterAll();

  // Register all shortcuts from configuration
  registerShortcut(shortcuts.persianToEnglish, 'persian-to-english');
  registerShortcut(shortcuts.englishToPersian, 'english-to-persian');
  registerShortcut(shortcuts.grammar, 'grammar');
  registerShortcut(shortcuts.responseSuggestions, 'response-suggestions');
};

export const reloadShortcuts = (window: BrowserWindow, shortcuts: ShortcutsConfig): void => {
  // Unregister all shortcuts
  unregisterShortcuts();
  
  // Register new shortcuts
  registerShortcuts(window, shortcuts);
};

export const unregisterShortcuts = (): void => {
  globalShortcut.unregisterAll();
};

