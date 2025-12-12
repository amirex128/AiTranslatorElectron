export interface ElectronAPI {
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<boolean>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  show: () => Promise<void>;
  focus: () => Promise<void>;
  onShortcut: (callback: (shortcut: { type: string; text: string }) => void) => void;
  checkAIProvider: (url: string) => Promise<boolean>;
  translatePersianToEnglish: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  translateEnglishToPersian: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  translateGrammar: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchTTSAudio: (url: string) => Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>;
  getCache: (params: { model: string; userInput: string; systemTemplate: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  setCache: (params: { model: string; userInput: string; systemTemplate: string; result: any }) => Promise<{ success: boolean; error?: string }>;
  clearCache: () => Promise<{ success: boolean; error?: string }>;
  getAllHistory: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  addHistory: (entry: any) => Promise<{ success: boolean; error?: string }>;
  deleteHistory: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearHistory: () => Promise<{ success: boolean; error?: string }>;
  getSettings: () => Promise<{ success: boolean; data?: any; error?: string }>;
  updateSettings: (partial: any) => Promise<{ success: boolean; error?: string }>;
  resetSettings: () => Promise<{ success: boolean; error?: string }>;
  onSettingsChange: (callback: () => void) => void;
  onSettingsOpenPage: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

