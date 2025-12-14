import { app, Tray, Menu, nativeImage, dialog } from 'electron';
import { showWindow, closeWindow, mainWindow, createWindow, loadAppIcon } from './window';
import { databaseService } from './database/DatabaseService';

let tray: Tray | null = null;

export const createTray = (): void => {
  // Load icon using shared function (same as window)
  let icon = loadAppIcon();
  
  // Resize icon for tray (tray icons should be small, typically 16x16 or 32x32)
  if (!icon.isEmpty()) {
    const size = icon.getSize();
    if (size.width > 32 || size.height > 32) {
      icon = icon.resize({ width: 32, height: 32 });
      console.log('[Tray] Icon resized for tray, size:', icon.getSize());
    }
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

