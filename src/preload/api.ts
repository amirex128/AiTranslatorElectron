import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '../types/electron';
import { AIModel } from '../models/AIModel';
import { TranslationResult } from '../utils/validation';
import { AppSettings } from '../types/settings';
import { GrammarTeachingResult } from '../services/ai/AIChatService';

interface TranslationParams {
  text: string;
  model: AIModel;
}

interface HistoryEntry {
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
  model: AIModel;
  result: TranslationResult | null; // null for grammar-teaching and response-suggestions
  grammarTeachingResult?: GrammarTeachingResult; // Only for grammar-teaching type
  responseSuggestionsResult?: import('../types/responseSuggestions').ResponseSuggestionsResult; // Only for response-suggestions type
  responseTime?: number;
}

export const electronAPI: ElectronAPI = {
  // Clipboard
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),

        // Window
        minimize: async () => {
          const response = await ipcRenderer.invoke('window:minimize');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to minimize window');
          }
        },
        maximize: async () => {
          const response = await ipcRenderer.invoke('window:maximize');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to maximize window');
          }
        },
        restore: async () => {
          const response = await ipcRenderer.invoke('window:restore');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to restore window');
          }
        },
        isMaximized: async () => {
          const response = await ipcRenderer.invoke('window:isMaximized');
          if (response && 'success' in response) {
            if (response.success) {
              return response.data as boolean;
            } else {
              throw new Error('error' in response ? response.error : 'Failed to check maximize state');
            }
          }
          return false;
        },
        close: async () => {
          const response = await ipcRenderer.invoke('window:close');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to close window');
          }
        },
        show: async () => {
          const response = await ipcRenderer.invoke('window:show');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to show window');
          }
        },
        focus: async () => {
          const response = await ipcRenderer.invoke('window:focus');
          if (response && 'success' in response && !response.success) {
            throw new Error('error' in response ? response.error : 'Failed to focus window');
          }
        },

  // Shortcuts
  onShortcut: (callback: (shortcut: { type: string; text: string }) => void) => {
    ipcRenderer.on('shortcut', (_event, shortcut) => callback(shortcut));
  },

  // Health check
  checkAIProvider: (url: string) => ipcRenderer.invoke('ai-provider:check', url),

  // Translation
  translatePersianToEnglish: (params: TranslationParams) => ipcRenderer.invoke('translate:persian-to-english', params),
  translateEnglishToPersian: (params: TranslationParams) => ipcRenderer.invoke('translate:english-to-persian', params),
  translateGrammar: (params: TranslationParams) => ipcRenderer.invoke('translate:grammar', params),
  translateGrammarTeaching: (params: TranslationParams) => ipcRenderer.invoke('translate:grammar-teaching', params),
  translateResponseSuggestions: (params: TranslationParams) => ipcRenderer.invoke('translate:response-suggestions', params),

  // TTS
  fetchTTSAudio: (url: string) => ipcRenderer.invoke('tts:fetch-audio', url),

  // History
  getAllHistory: () => ipcRenderer.invoke('history:getAll'),
  addHistory: (entry: HistoryEntry) => ipcRenderer.invoke('history:add', entry),
  deleteHistory: (id: string) => ipcRenderer.invoke('history:delete', id),
  clearHistory: () => ipcRenderer.invoke('history:clear'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
  openSettings: () => {
    ipcRenderer.send('settings:openPage');
  },
  openAbout: () => {
    ipcRenderer.send('about:openPage');
  },
  clearHistoryWithConfirmation: () => ipcRenderer.invoke('history:clearWithConfirmation'),
  openDevTools: () => ipcRenderer.invoke('window:openDevTools'),

  onSettingsOpenPage: (callback: () => void) => {
    ipcRenderer.on('settings:openPage', () => callback());
  },
  onAboutOpenPage: (callback: () => void) => {
    ipcRenderer.on('about:openPage', () => callback());
  },

  // Speech Recognition
  isSpeechRecognitionAvailable: () => ipcRenderer.invoke('speech:isAvailable'),
  startSpeechRecognition: () => ipcRenderer.invoke('speech:start'),
  stopSpeechRecognition: () => ipcRenderer.invoke('speech:stop'),
  getSpeechRecognitionStatus: () => ipcRenderer.invoke('speech:getStatus'),
  onSpeechStatus: (callback: (status: { isListening: boolean }) => void) => {
    ipcRenderer.on('speech:status', (_event, status) => callback(status));
  },

  // Quick Translate
  quickTranslateGetCached: (englishText: string) => ipcRenderer.invoke('quick-translate:get-cached', { englishText }),
  quickTranslateSaveCached: (englishText: string, persianTranslation: string) => ipcRenderer.invoke('quick-translate:save-cached', { englishText, persianTranslation }),
  quickTranslateTranslate: (englishText: string) => ipcRenderer.invoke('quick-translate:translate', { englishText }),

  // Bookmarks
  getAllBookmarks: (filters?: any) => ipcRenderer.invoke('bookmark:get-all', filters),
  checkBookmark: (englishText: string) => ipcRenderer.invoke('bookmark:check', englishText),
  addBookmark: (englishText: string) => ipcRenderer.invoke('bookmark:add', englishText),
  removeBookmark: (id: string) => ipcRenderer.invoke('bookmark:remove', id),
  updateBookmark: (id: string, updates: any) => ipcRenderer.invoke('bookmark:update', { id, updates }),
  translateBookmarkMain: (id: string) => ipcRenderer.invoke('bookmark:translate-main', id),
  translateBookmarkFallback: (id: string) => ipcRenderer.invoke('bookmark:translate-fallback', id),
  translateBookmarkQuick: (id: string) => ipcRenderer.invoke('bookmark:translate-quick', id),
  incrementBookmarkReadCount: (id: string) => ipcRenderer.invoke('bookmark:increment-read-count', id),
  resetBookmarkReadCount: (id: string) => ipcRenderer.invoke('bookmark:reset-read-count', id),
  generateBookmarkMainExamples: (id: string) => ipcRenderer.invoke('bookmark:generate-main-examples', id),
  generateBookmarkFallbackExamples: (id: string) => ipcRenderer.invoke('bookmark:generate-fallback-examples', id),

  // Data Import/Export
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
  onDataImported: (callback: () => void) => {
    ipcRenderer.on('data:imported', () => callback());
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

