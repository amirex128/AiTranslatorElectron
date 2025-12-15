import { BrowserWindow, nativeImage } from 'electron';
import { APP_CONFIG } from '../constants/appConfig';
import { getAssetPath } from './utils/assetsPath';
import { existsSync, readFileSync } from 'fs';

export let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Shared function to load icon (used by both window and tray)
export function loadAppIcon(): Electron.NativeImage {
  const iconPath = getAssetPath('images.png');
  console.log('[AppIcon] Loading icon from:', iconPath);
  
  let icon: Electron.NativeImage;
  try {
    // Try to load icon even if existsSync returns false
    // (because existsSync doesn't work for files inside asar archive)
    // Try to load icon using createFromPath first
    // This works even for files inside asar archive
    try {
      icon = nativeImage.createFromPath(iconPath);
      // If icon is empty, try reading from buffer
      if (icon.isEmpty()) {
        console.warn('[AppIcon] Icon from path is empty, trying buffer method');
        try {
          const iconBuffer = readFileSync(iconPath);
          icon = nativeImage.createFromBuffer(iconBuffer);
        } catch (bufferError) {
          console.warn('[AppIcon] Buffer read failed:', bufferError);
        }
      }
    } catch (pathError) {
      // If createFromPath fails, try reading from buffer
      console.warn('[AppIcon] createFromPath failed, trying buffer method:', pathError);
      try {
        const iconBuffer = readFileSync(iconPath);
        icon = nativeImage.createFromBuffer(iconBuffer);
      } catch (bufferError) {
        console.error('[AppIcon] Both createFromPath and createFromBuffer failed:', bufferError);
        icon = nativeImage.createEmpty();
      }
    }
    
    // If icon is still empty, create a fallback
    if (icon.isEmpty()) {
      console.warn('[AppIcon] Icon file is empty or not found at:', iconPath);
      icon = nativeImage.createEmpty();
    } else {
      console.log('[AppIcon] Icon loaded successfully, size:', icon.getSize());
    }
  } catch (error) {
    console.error('[AppIcon] Error loading icon:', error);
    icon = nativeImage.createEmpty();
  }
  
  return icon;
}

export const createWindow = async (): Promise<void> => {
  const windowSize = APP_CONFIG.windowSize;

  // Load icon using shared function (same as tray)
  const windowIcon = loadAppIcon();
  const iconPath = getAssetPath('images.png');

  mainWindow = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    minWidth: 600,
    minHeight: 400,
    frame: false, // Remove default title bar
    titleBarStyle: 'hidden',
    // For Windows, use icon path directly (more reliable than NativeImage)
    icon: process.platform === 'win32' ? iconPath : windowIcon,
    maximizable: true, // Enable maximize button
    minimizable: true, // Enable minimize button
    closable: true, // Enable close button
    resizable: true, // Enable window resizing
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: false, // Disable sandbox to avoid chrome-sandbox permission issues in development
    },
    show: false,
  });

  // Set basic CSP for security (TTS is handled via IPC, no need for Google TTS CSP)
  const session = mainWindow.webContents.session;
  
  // Handle permissions for various features
  session.setPermissionRequestHandler((webContents, permission, callback) => {
    // Allow media (microphone) access for speech recognition
    if (permission === 'media') {
      callback(true);
    }
    // Note: Clipboard access via Electron's IPC API doesn't require permissions
    // The browser API fallback in our code will handle permission errors gracefully
    else {
      callback(false);
    }
  });

  session.webRequest.onHeadersReceived((details, callback) => {
    // In development, we need 'unsafe-eval' for webpack HMR
    // In production, this warning won't appear as mentioned in Electron docs
    const isDev = !require('electron').app.isPackaged;
    
    const cspHeader = isDev
      ? // Development CSP (allows webpack HMR)
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data:; " +
        "media-src 'self' blob: data: https:; " +
        "connect-src 'self' ws://localhost:* ws://0.0.0.0:* http://localhost:* http://0.0.0.0:* https://www.google.com https://speech.googleapis.com; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:;"
      : // Production CSP (more restrictive, no unsafe-eval)
        "default-src 'self' 'unsafe-inline' data:; " +
        "media-src 'self' blob: data: https:; " +
        "connect-src 'self' https://www.google.com https://speech.googleapis.com https://api.openrouter.ai; " +
        "script-src 'self' 'unsafe-inline'; " +
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

  // Set icon again after window is created (for Windows taskbar)
  // This ensures the icon is properly displayed in the taskbar
  if (process.platform === 'win32') {
    // Try both path and NativeImage for Windows
    try {
      mainWindow.setIcon(iconPath);
      console.log('[Window] Icon set for Windows taskbar using path:', iconPath);
    } catch (error) {
      console.warn('[Window] Failed to set icon using path, trying NativeImage:', error);
      if (!windowIcon.isEmpty()) {
        mainWindow.setIcon(windowIcon);
        console.log('[Window] Icon set for Windows taskbar using NativeImage');
      }
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    // Set icon again after window is shown (for Windows taskbar)
    if (process.platform === 'win32') {
      try {
        mainWindow?.setIcon(iconPath);
      } catch (error) {
        if (!windowIcon.isEmpty()) {
          mainWindow?.setIcon(windowIcon);
        }
      }
    }
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

