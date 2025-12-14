import { BrowserWindow } from 'electron';
import { APP_CONFIG } from '../constants/appConfig';

export let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export const createWindow = async (): Promise<void> => {
  const windowSize = APP_CONFIG.windowSize;

  // Get icon path using shared utility
  const { getAssetPath } = require('./utils/assetsPath');
  const iconPath = getAssetPath('images.png');
  
  console.log('[Window] Loading icon from:', iconPath);

  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    minWidth: 600,
    minHeight: 400,
    frame: false, // Remove default title bar
    titleBarStyle: 'hidden',
    icon: iconPath, // Set window icon
    maximizable: true, // Enable maximize button
    minimizable: true, // Enable minimize button
    closable: true, // Enable close button
    resizable: true, // Enable window resizing
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  // Set basic CSP for security (TTS is handled via IPC, no need for Google TTS CSP)
  const session = mainWindow.webContents.session;
  session.webRequest.onHeadersReceived((details, callback) => {
    const cspHeader = 
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; " +
      "media-src 'self' blob: data:; " +
      "connect-src 'self' ws://localhost:* ws://0.0.0.0:* http://localhost:* http://0.0.0.0:*; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data:;";

    const responseHeaders: Record<string, string | string[]> = {
      ...details.responseHeaders,
    };

    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['content-security-policy'];
    responseHeaders['Content-Security-Policy'] = cspHeader;

    callback({ responseHeaders });
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
      }
    }
  });

  // Clean up reference when window is destroyed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

export const showWindow = async (): Promise<void> => {
  // Check if window exists and is not destroyed
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    } catch (error) {
      console.error('Error showing window:', error);
      // Window might be destroyed, create a new one
      await createWindow();
    }
  } else {
    // Window was destroyed or doesn't exist, create a new one
    await createWindow();
  }
};

export const minimizeWindow = (): void => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
};

export const maximizeWindow = (): void => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.maximize();
    } catch (error) {
      console.error('Error maximizing window:', error);
    }
  } else {
    console.warn('Cannot maximize: window is null or destroyed');
  }
};

export const restoreWindow = (): void => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.restore();
      }
    } catch (error) {
      console.error('Error restoring window:', error);
    }
  }
};

export const closeWindow = (): void => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    isQuitting = true;
    // Remove all listeners to prevent issues
    mainWindow.removeAllListeners();
    mainWindow.close();
  }
  // Set to null after a short delay to ensure cleanup
  setTimeout(() => {
    mainWindow = null;
  }, 100);
};

export const updateWindowSize = (width: number, height: number): void => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
};

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

