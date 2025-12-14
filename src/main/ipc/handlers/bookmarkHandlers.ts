import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { bookmarkService, Bookmark } from '../../database/BookmarkService';
import { handleIPC } from '../utils';
import { APP_CONFIG } from '../../../constants/appConfig';
import { AIServiceFactory } from '../../services/AIServiceFactory';
import { SimpleTranslationService } from '../../../services/ai/SimpleTranslationService';
import { ExampleSentencesService } from '../../../services/ai/ExampleSentencesService';

interface BookmarkFilters {
  searchQuery?: string;
  sortBy?: 'date' | 'alphabet' | 'readCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Registers bookmark IPC handlers
 */
export function registerBookmarkHandlers(): void {
  // Get all bookmarks with filters and pagination
  ipcMain.handle('bookmark:get-all', handleIPC(async (_event: IpcMainInvokeEvent, filters?: BookmarkFilters) => {
    return await bookmarkService.getAllBookmarks(filters);
  }));

  // Check if a bookmark exists for given text
  ipcMain.handle('bookmark:check', handleIPC(async (_event: IpcMainInvokeEvent, englishText: string) => {
    return await bookmarkService.checkBookmark(englishText);
  }));

  // Add a new bookmark
  ipcMain.handle('bookmark:add', handleIPC(async (_event: IpcMainInvokeEvent, englishText: string) => {
    return await bookmarkService.addBookmark(englishText);
  }));

  // Remove a bookmark
  ipcMain.handle('bookmark:remove', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    return await bookmarkService.removeBookmark(id);
  }));

  // Update a bookmark
  interface UpdateBookmarkParams {
    id: string;
    updates: Partial<Bookmark>;
  }
  ipcMain.handle('bookmark:update', handleIPC(async (_event: IpcMainInvokeEvent, params: UpdateBookmarkParams) => {
    return await bookmarkService.updateBookmark(params.id, params.updates);
  }));

  // Translate bookmark with main model
  ipcMain.handle('bookmark:translate-main', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // Get settings for model selection
    const selectedModel = APP_CONFIG.selectedModel;
    const settings = APP_CONFIG as any;
    
    // Create SimpleTranslationService with current settings
    const simpleService = new SimpleTranslationService({
      aiProviderUrl: settings.aiProviderUrl,
      temperature: settings.temperature,
      openRouterBaseUrl: settings.openRouterBaseUrl,
      openRouterApiKey1: settings.openRouterApiKey1,
      openRouterApiKey2: settings.openRouterApiKey2,
      openRouterReferer: settings.openRouterReferer,
      openRouterSiteName: settings.openRouterSiteName,
    });
    
    // Translate using simple service (single translation)
    const response = await simpleService.translateEnglishToPersian(
      bookmark.englishText,
      selectedModel
    );

    if (!response || !response.persian) {
      throw new Error('Translation failed');
    }

    // Convert simple translation to TranslationResult format
    // For bookmarks, we'll store just the first translation option
    const translationResult = {
      persian_1: response.persian,
      english_1: bookmark.englishText, // Keep original English
      persian_2: response.persian, // Same for simplicity
      english_2: bookmark.englishText,
      persian_3: response.persian,
      english_3: bookmark.englishText,
    };

    // Update bookmark with translation
    const updated = await bookmarkService.updateBookmark(id, {
      mainTranslation: translationResult,
    });

    return updated;
  }));

  // Translate bookmark with fallback model
  ipcMain.handle('bookmark:translate-fallback', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // Get settings for fallback model selection
    const fallbackModel = APP_CONFIG.fallbackSelectedModel;
    const settings = APP_CONFIG as any;
    
    // Create SimpleTranslationService with current settings
    const simpleService = new SimpleTranslationService({
      aiProviderUrl: settings.aiProviderUrl,
      temperature: settings.temperature,
      openRouterBaseUrl: settings.openRouterBaseUrl,
      openRouterApiKey1: settings.openRouterApiKey1,
      openRouterApiKey2: settings.openRouterApiKey2,
      openRouterReferer: settings.openRouterReferer,
      openRouterSiteName: settings.openRouterSiteName,
    });
    
    // Translate using simple service (single translation)
    const response = await simpleService.translateEnglishToPersian(
      bookmark.englishText,
      fallbackModel
    );

    if (!response || !response.persian) {
      throw new Error('Translation failed');
    }

    // Convert simple translation to TranslationResult format
    const translationResult = {
      persian_1: response.persian,
      english_1: bookmark.englishText,
      persian_2: response.persian,
      english_2: bookmark.englishText,
      persian_3: response.persian,
      english_3: bookmark.englishText,
    };

    // Update bookmark with translation
    const updated = await bookmarkService.updateBookmark(id, {
      fallbackTranslation: translationResult,
    });

    return updated;
  }));

  // Translate bookmark with quick translate (Google Translate)
  ipcMain.handle('bookmark:translate-quick', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // Use quick translate service (Google Translate)
    const { quickTranslateService } = require('../../../services/quickTranslate/QuickTranslateService');
    
    const translation = await quickTranslateService.translate(bookmark.englishText);

    // Update bookmark with quick translation
    const updated = await bookmarkService.updateBookmark(id, {
      quickTranslation: translation,
    });

    return updated;
  }));

  // Increment read count
  ipcMain.handle('bookmark:increment-read-count', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    console.log('[BookmarkHandlers] Incrementing read count for bookmark:', id);
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    const currentCount = bookmark.readCount ?? 0;
    const updated = await bookmarkService.updateBookmark(id, {
      readCount: currentCount + 1,
    });

    console.log('[BookmarkHandlers] Read count incremented:', currentCount, '->', updated.readCount);
    return updated;
  }));

  // Reset read count
  ipcMain.handle('bookmark:reset-read-count', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    console.log('[BookmarkHandlers] Resetting read count for bookmark:', id);
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    const updated = await bookmarkService.updateBookmark(id, {
      readCount: 0,
    });

    console.log('[BookmarkHandlers] Read count reset to 0');
    return updated;
  }));

  // Generate main model examples
  ipcMain.handle('bookmark:generate-main-examples', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // Get settings for model selection
    const selectedModel = APP_CONFIG.selectedModel;
    const settings = APP_CONFIG as any;
    
    // Create ExampleSentencesService with current settings
    const exampleService = new ExampleSentencesService({
      aiProviderUrl: settings.aiProviderUrl,
      temperature: settings.temperature,
      openRouterBaseUrl: settings.openRouterBaseUrl,
      openRouterApiKey1: settings.openRouterApiKey1,
      openRouterApiKey2: settings.openRouterApiKey2,
      openRouterReferer: settings.openRouterReferer,
      openRouterSiteName: settings.openRouterSiteName,
    });
    
    // Generate examples using main model
    const examples = await exampleService.generateMainExamples(
      bookmark.englishText,
      selectedModel
    );

    if (!examples || examples.length === 0) {
      throw new Error('Failed to generate examples');
    }

    // Update bookmark with examples
    const updated = await bookmarkService.updateBookmark(id, {
      mainExamples: examples,
    });

    return updated;
  }));

  // Generate fallback model examples
  ipcMain.handle('bookmark:generate-fallback-examples', handleIPC(async (_event: IpcMainInvokeEvent, id: string) => {
    const bookmark = await bookmarkService.getBookmarkById(id);
    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    // Get settings for model selection
    const fallbackModel = APP_CONFIG.fallbackSelectedModel;
    const settings = APP_CONFIG as any;
    
    // Create ExampleSentencesService with current settings
    const exampleService = new ExampleSentencesService({
      aiProviderUrl: settings.aiProviderUrl,
      temperature: settings.temperature,
      openRouterBaseUrl: settings.openRouterBaseUrl,
      openRouterApiKey1: settings.openRouterApiKey1,
      openRouterApiKey2: settings.openRouterApiKey2,
      openRouterReferer: settings.openRouterReferer,
      openRouterSiteName: settings.openRouterSiteName,
    });
    
    // Generate examples using fallback model
    const examples = await exampleService.generateFallbackExamples(
      bookmark.englishText,
      fallbackModel
    );

    if (!examples || examples.length === 0) {
      throw new Error('Failed to generate examples');
    }

    // Update bookmark with examples
    const updated = await bookmarkService.updateBookmark(id, {
      fallbackExamples: examples,
    });

    return updated;
  }));

  console.log('[BookmarkHandlers] All bookmark handlers registered, including read count handlers and example generation handlers');
}

