import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { AIModel } from '../models/AIModel';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar';
  model: AIModel;
  result: TranslationResult;
  responseTime?: number; // Time in seconds
}

interface HistoryState {
  entries: HistoryEntry[];
  searchQuery: string;
  isLoading: boolean;

  // Actions
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  getFilteredEntries: () => HistoryEntry[];
}

const loadHistoryFromDatabase = async (): Promise<HistoryEntry[]> => {
  if (typeof window === 'undefined' || !window.electronAPI) {
    return [];
  }

  try {
    const response = await window.electronAPI.getAllHistory();
    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.error('Error loading history from database:', error);
  }
  return [];
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  searchQuery: '',
  isLoading: false,

  loadEntries: async () => {
    set({ isLoading: true });
    try {
      const entries = await loadHistoryFromDatabase();
      set({ entries, isLoading: false });
    } catch (error) {
      console.error('Error loading entries:', error);
      set({ isLoading: false });
    }
  },

  addEntry: async (entry) => {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      await window.electronAPI.addHistory(entry);
      
      // Reload entries from database
      const entries = await loadHistoryFromDatabase();
      set({ entries });
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  },

  deleteEntry: async (id) => {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      await window.electronAPI.deleteHistory(id);
      
      // Reload entries from database
      const entries = await loadHistoryFromDatabase();
      set({ entries });
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  },

  clearHistory: async () => {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      await window.electronAPI.clearHistory();
      set({ entries: [], searchQuery: '' });
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  getFilteredEntries: () => {
    const { entries, searchQuery } = get();
    if (!searchQuery.trim()) {
      return entries;
    }

    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.input.toLowerCase().includes(query) ||
        entry.result.english_1.toLowerCase().includes(query) ||
        entry.result.persian_1.toLowerCase().includes(query)
    );
  },
}));

