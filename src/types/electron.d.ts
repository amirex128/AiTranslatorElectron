export interface ElectronAPI {
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<boolean>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  show: () => Promise<void>;
  focus: () => Promise<void>;
  getSettings: () => Promise<any>;
  setSettings: (settings: any) => Promise<void>;
  onShortcut: (callback: (shortcut: { type: string; text: string }) => void) => void;
  checkOllama: (url: string) => Promise<boolean>;
  translatePersianToEnglish: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  translateEnglishToPersian: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  translateGrammar: (params: any) => Promise<{ success: boolean; data?: any; error?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

