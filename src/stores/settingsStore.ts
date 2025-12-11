import { create } from 'zustand';
import { OllamaModel } from '../models/OllamaModel';

interface SettingsState {
  selectedModel: OllamaModel;
  ollamaUrl: string;
  temperature: number;
  fontSize: number;
  rtlDirection: boolean;
  darkMode: boolean;
  windowSize: { width: number; height: number };

  // Actions
  setSelectedModel: (model: OllamaModel) => void;
  setOllamaUrl: (url: string) => void;
  setTemperature: (temp: number) => void;
  setFontSize: (size: number) => void;
  setRtlDirection: (rtl: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setWindowSize: (size: { width: number; height: number }) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

const defaultSettings = {
  selectedModel: OllamaModel.QWEN3_8B,
  ollamaUrl: 'http://localhost:11434',
  temperature: 0.7,
  fontSize: 16,
  rtlDirection: false,
  darkMode: false,
  windowSize: { width: 800, height: 600 },
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  setSelectedModel: (model) => {
    set({ selectedModel: model });
    get().saveSettings().catch(console.error);
  },
  setOllamaUrl: (url) => {
    set({ ollamaUrl: url });
    get().saveSettings().catch(console.error);
  },
  setTemperature: (temp) => {
    set({ temperature: temp });
    get().saveSettings().catch(console.error);
  },
  setFontSize: (size) => {
    set({ fontSize: size });
    get().saveSettings().catch(console.error);
  },
  setRtlDirection: (rtl) => {
    set({ rtlDirection: rtl });
    get().saveSettings().catch(console.error);
  },
  setDarkMode: (dark) => {
    set({ darkMode: dark });
    get().saveSettings().catch(console.error);
  },
  setWindowSize: (size) => {
    set({ windowSize: size });
    get().saveSettings().catch(console.error);
  },
  loadSettings: async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const settings = await window.electronAPI.getSettings();
        if (settings) {
          set({
            selectedModel: settings.selectedModel || defaultSettings.selectedModel,
            ollamaUrl: settings.ollamaUrl || defaultSettings.ollamaUrl,
            temperature: settings.temperature ?? defaultSettings.temperature,
            fontSize: settings.fontSize ?? defaultSettings.fontSize,
            rtlDirection: settings.rtlDirection ?? defaultSettings.rtlDirection,
            darkMode: settings.darkMode ?? defaultSettings.darkMode,
            windowSize: settings.windowSize || defaultSettings.windowSize,
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  },
  saveSettings: async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const currentState = get();
        await window.electronAPI.setSettings({
          selectedModel: currentState.selectedModel,
          ollamaUrl: currentState.ollamaUrl,
          temperature: currentState.temperature,
          fontSize: currentState.fontSize,
          rtlDirection: currentState.rtlDirection,
          darkMode: currentState.darkMode,
          windowSize: currentState.windowSize,
        });
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  },
}));

