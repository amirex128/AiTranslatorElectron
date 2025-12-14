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
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Starting tray creation',data:{iconPath,exists:existsSync(iconPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  let icon: Electron.NativeImage;
  try {
    // Try to load icon even if existsSync returns false
    // (because existsSync doesn't work for files inside asar archive)
    const iconExists = existsSync(iconPath);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Attempting to load icon',data:{iconPath,exists:iconExists},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Try to load icon using createFromPath first
    // This works even for files inside asar archive
    try {
      icon = nativeImage.createFromPath(iconPath);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'createFromPath result',data:{isEmpty:icon.isEmpty(),size:icon.isEmpty()?null:icon.getSize()},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // If icon is empty, try reading from buffer
      if (icon.isEmpty()) {
        console.warn('[Tray] Icon from path is empty, trying buffer method');
        try {
          const iconBuffer = readFileSync(iconPath);
          icon = nativeImage.createFromBuffer(iconBuffer);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'createFromBuffer result',data:{isEmpty:icon.isEmpty(),size:icon.isEmpty()?null:icon.getSize(),bufferSize:iconBuffer.length},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
        } catch (bufferError) {
          console.warn('[Tray] Buffer read failed:', bufferError);
        }
      }
    } catch (pathError) {
      // If createFromPath fails, try reading from buffer
      console.warn('[Tray] createFromPath failed, trying buffer method:', pathError);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'createFromPath failed',data:{error:String(pathError)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
        const iconBuffer = readFileSync(iconPath);
        icon = nativeImage.createFromBuffer(iconBuffer);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'createFromBuffer after path error',data:{isEmpty:icon.isEmpty(),size:icon.isEmpty()?null:icon.getSize()},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      } catch (bufferError) {
        console.error('[Tray] Both createFromPath and createFromBuffer failed:', bufferError);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Both methods failed',data:{bufferError:String(bufferError)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        icon = nativeImage.createEmpty();
      }
    }
    
    // If icon is still empty, create a fallback
    if (icon.isEmpty()) {
      console.warn('[Tray] Icon file is empty or not found at:', iconPath);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Icon is empty',data:{iconPath},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      icon = nativeImage.createEmpty();
    } else {
      // Resize icon for tray (tray icons should be small, typically 16x16 or 32x32)
      const size = icon.getSize();
      if (size.width > 32 || size.height > 32) {
        icon = icon.resize({ width: 32, height: 32 });
      }
      console.log('[Tray] Icon loaded successfully, size:', icon.getSize());
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Icon loaded successfully',data:{size:icon.getSize()},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  } catch (error) {
    console.error('[Tray] Error loading tray icon:', error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Error loading icon',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    icon = nativeImage.createEmpty();
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/tray.ts:createTray',message:'Creating Tray',data:{isEmpty:icon.isEmpty(),size:icon.isEmpty()?null:icon.getSize()},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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

