import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  // Clipboard
  readClipboard: () => ipcRenderer.invoke('clipboard:read'),
  writeClipboard: (text: string) => ipcRenderer.invoke('clipboard:write', text),

  // Window
  minimize: () => ipcRenderer.invoke('window:minimize'),
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
  translatePersianToEnglish: (params: any) => ipcRenderer.invoke('translate:persian-to-english', params),
  translateEnglishToPersian: (params: any) => ipcRenderer.invoke('translate:english-to-persian', params),
  translateGrammar: (params: any) => ipcRenderer.invoke('translate:grammar', params),

  // TTS
  fetchTTSAudio: (url: string) => ipcRenderer.invoke('tts:fetch-audio', url),

  // Cache
  getCache: (params: { model: string; userInput: string; systemTemplate: string }) =>
    ipcRenderer.invoke('cache:get', params),
  setCache: (params: { model: string; userInput: string; systemTemplate: string; result: any }) =>
    ipcRenderer.invoke('cache:set', params),
  clearCache: () => ipcRenderer.invoke('cache:clear'),

  // History
  getAllHistory: () => ipcRenderer.invoke('history:getAll'),
  addHistory: (entry: any) => ipcRenderer.invoke('history:add', entry),
  deleteHistory: (id: string) => ipcRenderer.invoke('history:delete', id),
  clearHistory: () => ipcRenderer.invoke('history:clear'),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial: any) => ipcRenderer.invoke('settings:update', partial),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  onSettingsChange: (callback: () => void) => {
    ipcRenderer.on('settings:changed', () => callback());
  },
  onSettingsOpenPage: (callback: () => void) => {
    ipcRenderer.on('settings:openPage', () => callback());
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

