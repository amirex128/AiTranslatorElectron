import { app, Tray, Menu, nativeImage, dialog } from 'electron';
import { showWindow, closeWindow, mainWindow, createWindow } from './window';
import { databaseService } from './database/DatabaseService';
import { join } from 'path';
import { existsSync } from 'fs';

let tray: Tray | null = null;

export const createTray = (): void => {
  // Load icon from assets folder
  // Use same logic as DatabaseService for finding assets path
  const isDev = !app.isPackaged;
  const path = require('path');
  let iconPath: string;
  
  if (isDev) {
    // In development, use src/assets directly from project root
    const appPath = app.getAppPath();
    let projectRoot = appPath;
    
    // If we're in .webpack/main, go up 3 levels
    if (appPath.includes('.webpack')) {
      projectRoot = path.join(appPath, '..', '..', '..');
    } else if (appPath.includes('src')) {
      // If we're in src/, go up 1 level
      projectRoot = path.join(appPath, '..');
    } else {
      // Try to find project root by looking for package.json
      let currentPath = appPath;
      for (let i = 0; i < 5; i++) {
        if (existsSync(path.join(currentPath, 'package.json'))) {
          projectRoot = currentPath;
          break;
        }
        currentPath = path.join(currentPath, '..');
      }
    }
    
    iconPath = path.join(projectRoot, 'src', 'assets', 'images.png');
  } else {
    // In production, assets are unpacked from asar
    // When files are unpacked, they go to app.asar.unpacked directory
    const appPath = app.getAppPath();
    
    // Try app.asar.unpacked first (where unpacked files go)
    const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
    iconPath = path.join(unpackedPath, 'src', 'assets', 'images.png');
    
    // If unpacked path doesn't exist, try resources/app/src/assets
    if (!existsSync(iconPath)) {
      const resourcesPath = path.join(appPath, '..', '..', 'resources');
      iconPath = path.join(resourcesPath, 'app', 'src', 'assets', 'images.png');
    }
    
    // Fallback: try process.resourcesPath
    if (!existsSync(iconPath) && process.resourcesPath) {
      iconPath = path.join(process.resourcesPath, 'app', 'src', 'assets', 'images.png');
    }
    
    // Last fallback: try app path directly
    if (!existsSync(iconPath)) {
      iconPath = path.join(appPath, 'src', 'assets', 'images.png');
    }
  }
  
  console.log('[Tray] Loading icon from:', iconPath);
  console.log('[Tray] Icon exists:', existsSync(iconPath));
  
  let icon: Electron.NativeImage;
  try {
    if (existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath);
      // If icon is empty, create a fallback
      if (icon.isEmpty()) {
        console.warn('[Tray] Icon file is empty, creating fallback');
        icon = nativeImage.createEmpty();
      } else {
        // Resize icon for tray (tray icons should be small, typically 16x16 or 32x32)
        const size = icon.getSize();
        if (size.width > 32 || size.height > 32) {
          icon = icon.resize({ width: 32, height: 32 });
        }
        console.log('[Tray] Icon loaded successfully, size:', icon.getSize());
      }
    } else {
      console.error('[Tray] Icon file not found at:', iconPath);
      console.error('[Tray] Tried paths:', [
        isDev ? path.join(app.getAppPath(), '..', 'src', 'assets', 'images.png') : 'N/A',
        isDev ? path.join(__dirname, '..', 'assets', 'images.png') : 'N/A',
      ]);
      icon = nativeImage.createEmpty();
    }
  } catch (error) {
    console.error('[Tray] Error loading tray icon:', error);
    icon = nativeImage.createEmpty();
  }
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'نمایش',
      click: async () => {
        await showWindow();
      },
    },
    {
      label: 'تنظیمات',
      click: async () => {
        await showWindow();
        // Wait a bit for window to be ready, then send message
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('settings:openPage');
          }
        }, 100);
      },
    },
    {
      label: 'درباره ما',
      click: async () => {
        await showWindow();
        // Wait a bit for window to be ready, then send message
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('about:openPage');
          }
        }, 100);
      },
    },
    {
      label: 'پاکسازی کش',
      click: async () => {
        await showWindow();
        // Wait a bit for window to be ready
        setTimeout(async () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            const result = await dialog.showMessageBox(mainWindow, {
              type: 'question',
              buttons: ['بله', 'خیر'],
              defaultId: 1,
              title: 'پاکسازی کش',
              message: 'آیا مطمئن هستید که می‌خواهید تمام کش (تاریخچه) را پاک کنید؟',
              cancelId: 1,
            });
            
            if (result.response === 0) {
              await databaseService.clearHistory();
              // Notify renderer to reload history
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('history:cleared');
              }
            }
          }
        }, 100);
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Inspect',
      click: async () => {
        await showWindow();
        // Wait a bit for window to be ready
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.openDevTools();
          }
        }, 100);
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'خروج',
      click: async () => {
        console.log('[Tray] Quit requested from tray menu');
        
        // Destroy tray first
        if (tray) {
          tray.destroy();
          tray = null;
        }
        
        // Close all windows
        closeWindow();
        
        // Close database connections
        try {
          await databaseService.close();
        } catch (error) {
          console.error('[Tray] Error closing database:', error);
        }
        
        // Force quit the application immediately
        console.log('[Tray] Force quitting application');
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip('مترجم هوش مصنوعی');
  tray.setContextMenu(contextMenu);

  tray.on('click', async () => {
    await showWindow();
  });
};

