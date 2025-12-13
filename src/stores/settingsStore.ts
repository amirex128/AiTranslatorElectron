import { create } from 'zustand';
import { AppSettings } from '../types/settings';
import { getDefaultSettings } from '../constants/defaultSettings';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const loadSettingsFromIPC = async (): Promise<AppSettings> => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    // Fallback to defaults if IPC not available
    return getDefaultSettings();
  }

  try {
    const response = await window.electronAPI.getSettings();
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error loading settings from IPC:', error);
  }

  // Fallback to defaults on error
  return getDefaultSettings();
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

