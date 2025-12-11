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
  checkOllama: (url: string) => ipcRenderer.invoke('ollama:check', url),

  // Translation
  translatePersianToEnglish: (params: any) => ipcRenderer.invoke('translate:persian-to-english', params),
  translateEnglishToPersian: (params: any) => ipcRenderer.invoke('translate:english-to-persian', params),
  translateGrammar: (params: any) => ipcRenderer.invoke('translate:grammar', params),
  onTranslationProgress: (callback: (progress: number) => void) => {
    ipcRenderer.on('translation:progress', (_event, progress) => callback(progress));
  },

  // TTS
  fetchTTSAudio: (url: string) => ipcRenderer.invoke('tts:fetch-audio', url),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

