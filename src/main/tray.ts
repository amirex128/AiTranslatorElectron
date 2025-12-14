import { app, Tray, Menu, nativeImage, dialog } from 'electron';
import { showWindow, closeWindow, mainWindow, createWindow } from './window';
import { databaseService } from './database/DatabaseService';
import { getAssetPath } from './utils/assetsPath';
import { existsSync, readFileSync } from 'fs';

let tray: Tray | null = null;

export const createTray = (): void => {
  // Load icon from assets folder using shared utility
  const iconPath = getAssetPath('images.png');
  
  console.log('[Tray] Loading icon from:', iconPath);
  console.log('[Tray] Icon exists:', existsSync(iconPath));
  
  let icon: Electron.NativeImage;
  try {
    if (existsSync(iconPath)) {
      // Try to load icon using createFromPath first
      try {
        icon = nativeImage.createFromPath(iconPath);
        // If icon is empty, try reading from buffer
        if (icon.isEmpty()) {
          console.warn('[Tray] Icon from path is empty, trying buffer method');
          const iconBuffer = readFileSync(iconPath);
          icon = nativeImage.createFromBuffer(iconBuffer);
        }
      } catch (pathError) {
        // If createFromPath fails, try reading from buffer
        console.warn('[Tray] createFromPath failed, trying buffer method:', pathError);
        try {
          const iconBuffer = readFileSync(iconPath);
          icon = nativeImage.createFromBuffer(iconBuffer);
        } catch (bufferError) {
          console.error('[Tray] Both createFromPath and createFromBuffer failed:', bufferError);
          icon = nativeImage.createEmpty();
        }
      }
      
      // If icon is still empty, create a fallback
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

