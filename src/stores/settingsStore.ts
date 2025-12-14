import { create } from 'zustand';
import { AppSettings } from '../types/settings';
import { getDefaultSettings } from '../constants/defaultSettings';
import { isValidApiKey } from '../utils/apiKeyValidation';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  checkApiKeyValid: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      // Settings are always read from .env via APP_CONFIG (main process) or IPC (renderer process)
      const settings = await getDefaultSettings();
      set({ settings, isLoading: false });
    } catch (error) {
      console.error('Error loading settings:', error);
      set({ isLoading: false });
    }
  },

  checkApiKeyValid: () => {
    const { settings } = get();
    if (!settings) {
      return false;
    }
    // Check if at least one API key is valid
    return isValidApiKey(settings.openRouterApiKey1) || isValidApiKey(settings.openRouterApiKey2);
  },
}));

