import { create } from 'zustand';
import { AIModel } from '../models/AIModel';
import { APP_CONFIG } from '../constants/appConfig';

export interface AppSettings {
  selectedModel: AIModel;
  aiProviderUrl: string;
  openRouterBaseUrl: string;
  openRouterApiKey1: string;
  openRouterApiKey2: string;
  openRouterReferer: string;
  openRouterSiteName: string;
  temperature: number;
  fontSize: number;
  windowSize: { width: number; height: number };
}

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const loadSettingsFromIPC = async (): Promise<AppSettings> => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    // Fallback to APP_CONFIG if IPC not available
    return {
      selectedModel: APP_CONFIG.selectedModel,
      aiProviderUrl: APP_CONFIG.aiProviderUrl,
      openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
      openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
      openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
      openRouterReferer: APP_CONFIG.openRouterReferer,
      openRouterSiteName: APP_CONFIG.openRouterSiteName,
      temperature: APP_CONFIG.temperature,
      fontSize: APP_CONFIG.fontSize,
      windowSize: APP_CONFIG.windowSize,
    };
  }

  try {
    const response = await window.electronAPI.getSettings();
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error loading settings from IPC:', error);
  }

  // Fallback to APP_CONFIG on error
  return {
    selectedModel: APP_CONFIG.selectedModel,
    aiProviderUrl: APP_CONFIG.aiProviderUrl,
    openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
    openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
    openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
    openRouterReferer: APP_CONFIG.openRouterReferer,
    openRouterSiteName: APP_CONFIG.openRouterSiteName,
    temperature: APP_CONFIG.temperature,
    fontSize: APP_CONFIG.fontSize,
    windowSize: APP_CONFIG.windowSize,
  };
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await loadSettingsFromIPC();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoading: false });
    }
  },

  updateSettings: async (partial: Partial<AppSettings>) => {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      const response = await window.electronAPI.updateSettings(partial);
      if (response.success) {
        // Reload settings from IPC
        const updatedSettings = await loadSettingsFromIPC();
        set({ settings: updatedSettings });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  },

  resetSettings: async () => {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      const response = await window.electronAPI.resetSettings();
      if (response.success) {
        // Reload settings from IPC
        const updatedSettings = await loadSettingsFromIPC();
        set({ settings: updatedSettings });
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  },
}));

