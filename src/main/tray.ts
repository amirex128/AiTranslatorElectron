import { app, Tray, Menu, nativeImage, dialog } from 'electron';
import { showWindow, closeWindow, mainWindow } from './window';
import { databaseService } from './database/DatabaseService';

let tray: Tray | null = null;

export const createTray = (): void => {
  // Create a simple icon (you can replace this with an actual icon file)
  const icon = nativeImage.createEmpty();
  
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'نمایش',
      click: () => {
        showWindow();
      },
    },
    {
      label: 'تنظیمات',
      click: () => {
        if (mainWindow) {
          showWindow();
          mainWindow.webContents.send('settings:openPage');
        }
      },
    },
    {
      label: 'درباره ما',
      click: () => {
        if (mainWindow) {
          showWindow();
          mainWindow.webContents.send('about:openPage');
        }
      },
    },
    {
      label: 'پاکسازی کش',
      click: async () => {
        if (mainWindow) {
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
            mainWindow.webContents.send('history:cleared');
          }
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Inspect',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.openDevTools();
          showWindow();
        }
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'خروج',
      click: () => {
        closeWindow();
        app.quit();
      },
    },
  ]);

  tray.setToolTip('مترجم هوش مصنوعی');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    showWindow();
  });
};

