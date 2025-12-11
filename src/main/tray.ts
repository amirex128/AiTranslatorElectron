import { app, Tray, Menu, nativeImage } from 'electron';
import { showWindow, closeWindow } from './window';

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

