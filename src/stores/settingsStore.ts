import { create } from 'zustand';
import { AppSettings } from '../types/settings';
import { getDefaultSettings } from '../constants/defaultSettings';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
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
}));

