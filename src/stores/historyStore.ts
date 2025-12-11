import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { OllamaModel } from '../models/OllamaModel';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar';
  model: OllamaModel;
  result: TranslationResult;
}

interface HistoryState {
  entries: HistoryEntry[];
  searchQuery: string;

  // Actions
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  deleteEntry: (id: string) => void;
  clearHistory: () => void;
  setSearchQuery: (query: string) => void;
  getFilteredEntries: () => HistoryEntry[];
}

const MAX_HISTORY_ENTRIES = 10;
const HISTORY_STORAGE_KEY = 'translation-history';

const loadHistoryFromStorage = (): HistoryEntry[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading history from storage:', error);
    }
  }
  return [];
};

const saveHistoryToStorage = (entries: HistoryEntry[]): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving history to storage:', error);
    }
  }
};

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: loadHistoryFromStorage(),
  searchQuery: '',

  addEntry: (entry) => {
    set((state) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };

      const updatedEntries = [newEntry, ...state.entries].slice(
        0,
        MAX_HISTORY_ENTRIES
      );

      saveHistoryToStorage(updatedEntries);
      return { entries: updatedEntries };
    });
  },
  deleteEntry: (id) => {
    set((state) => {
      const updatedEntries = state.entries.filter((entry) => entry.id !== id);
      saveHistoryToStorage(updatedEntries);
      return { entries: updatedEntries };
    });
  },
  clearHistory: () => {
    saveHistoryToStorage([]);
    set({ entries: [], searchQuery: '' });
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

