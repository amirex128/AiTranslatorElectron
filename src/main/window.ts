import { BrowserWindow } from 'electron';
import Store from 'electron-store';

interface StoreSchema {
  windowSize?: { width: number; height: number };
}

const store = new Store<StoreSchema>() as any;

export let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export const createWindow = (): void => {
  const savedSize = store.get('windowSize', { width: 800, height: 600 }) as {
    width: number;
    height: number;
  };

  mainWindow = new BrowserWindow({
    width: savedSize.width,
    height: savedSize.height,
    minWidth: 600,
    minHeight: 400,
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

  // Save window size on resize
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize();
      store.set('windowSize', { width, height });
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
};

export const showWindow = (): void => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
};

export const minimizeWindow = (): void => {
  mainWindow?.minimize();
};

export const closeWindow = (): void => {
  if (mainWindow) {
    isQuitting = true;
    mainWindow.close();
  }
};

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

