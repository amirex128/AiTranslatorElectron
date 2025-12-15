import { ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import { handleIPC } from '../utils';
import { dataImportExportService } from '../../services/DataImportExportService';
import { mainWindow } from '../../window';

/**
 * Registers import/export IPC handlers
 */
export function registerImportExportHandlers(): void {
  // Export data to ZIP file
  ipcMain.handle('data:export', handleIPC(async (_event: IpcMainInvokeEvent) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error('Window is not available');
    }

    // Show save dialog
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'خروجی گرفتن از داده‌ها',
      defaultPath: 'ai-translator-backup.zip',
      filters: [
        { name: 'ZIP Files', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      buttonLabel: 'ذخیره',
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    try {
      await dataImportExportService.exportData(result.filePath);
      
      // Show success message
      await dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'موفقیت',
        message: 'داده‌ها با موفقیت خروجی گرفته شدند',
        buttons: ['باشه'],
      });

      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('[ImportExportHandlers] Error exporting data:', error);
      
      // Show error message
      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: 'خطا',
        message: `خطا در خروجی گرفتن از داده‌ها: ${error instanceof Error ? error.message : String(error)}`,
        buttons: ['باشه'],
      });

      throw error;
    }
  }));

  // Import data from ZIP file
  ipcMain.handle('data:import', handleIPC(async (_event: IpcMainInvokeEvent) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      throw new Error('Window is not available');
    }

    // Show open dialog
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'وارد کردن داده‌ها',
      filters: [
        { name: 'ZIP Files', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      buttonLabel: 'باز کردن',
      properties: ['openFile'],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const zipFilePath = result.filePaths[0];

    // Show confirmation dialog
    const confirmResult = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'هشدار',
      message: 'آیا مطمئن هستید که می‌خواهید داده‌های موجود را با داده‌های فایل ZIP جایگزین کنید؟',
      detail: 'این عمل داده‌های فعلی (bookmarks، history و cache) را با داده‌های فایل ZIP جایگزین می‌کند و قابل بازگشت نیست.',
      buttons: ['بله، جایگزین کن', 'لغو'],
      defaultId: 1,
      cancelId: 1,
    });

    if (confirmResult.response !== 0) {
      return { canceled: true };
    }

    try {
      await dataImportExportService.importData(zipFilePath);
      
      // Show success message
      await dialog.showMessageBox(mainWindow!, {
        type: 'info',
        title: 'موفقیت',
        message: 'داده‌ها با موفقیت وارد شدند',
        detail: 'لطفاً صفحه را رفرش کنید تا تغییرات اعمال شوند.',
        buttons: ['باشه'],
      });

      // Notify renderer to reload data
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('data:imported');
      }

      return { success: true };
    } catch (error) {
      console.error('[ImportExportHandlers] Error importing data:', error);
      
      // Show error message
      await dialog.showMessageBox(mainWindow!, {
        type: 'error',
        title: 'خطا',
        message: `خطا در وارد کردن داده‌ها: ${error instanceof Error ? error.message : String(error)}`,
        buttons: ['باشه'],
      });

      throw error;
    }
  }));

  console.log('[ImportExportHandlers] Import/Export handlers registered');
}

