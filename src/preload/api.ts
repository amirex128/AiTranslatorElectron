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
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        restore: () => ipcRenderer.invoke('window:restore'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
        close: () => ipcRenderer.invoke('window:close'),
        show: () => ipcRenderer.invoke('window:show'),
        focus: () => ipcRenderer.invoke('window:focus'),

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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

