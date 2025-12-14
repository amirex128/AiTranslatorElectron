import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { AIModel } from '../models/AIModel';
import { GrammarTeachingResult } from '../services/ai/AIChatService';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching';
  model: AIModel;
  result: TranslationResult | null; // null for grammar-teaching
  grammarTeachingResult?: GrammarTeachingResult; // Only for grammar-teaching type
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
  findCachedEntry: (input: string, type: string, model: AIModel) => HistoryEntry | null;
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
    return entries.filter((entry) => {
      const inputMatch = entry.input.toLowerCase().includes(query);
      if (entry.type === 'grammar-teaching') {
        // For grammar teaching, search in originalText and correctedText
        const grammarResult = entry.grammarTeachingResult;
        if (grammarResult) {
          const originalMatch = grammarResult.originalText?.toLowerCase().includes(query);
          const correctedMatch = grammarResult.correctedText?.toLowerCase().includes(query);
          return inputMatch || originalMatch || correctedMatch;
        }
        return inputMatch;
      } else if (entry.result) {
        // For regular translations
        return (
          inputMatch ||
          entry.result.english_1.toLowerCase().includes(query) ||
          entry.result.persian_1.toLowerCase().includes(query)
        );
      }
      return inputMatch;
    });
  },

  findCachedEntry: (input: string, type: string, model: AIModel): HistoryEntry | null => {
    const { entries } = get();
    const trimmedInput = input.trim();
    
    return entries.find((entry) => {
      return (
        entry.input.trim() === trimmedInput &&
        entry.type === type &&
        entry.model === model
      );
    }) || null;
  },
}));

