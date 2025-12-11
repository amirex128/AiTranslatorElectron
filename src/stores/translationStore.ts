import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { AIModel } from '../models/AIModel';

interface TranslationState {
  // Inputs
  persianToEnglishInput: string;
  englishToPersianInput: string;
  grammarInput: string;

  // Results
  results: TranslationResult | null;
  selectedResult: number | null;
  editedResults: Partial<TranslationResult> | null;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;
  errorDetails: string | null;
  showErrorDetails: boolean;

  // Actions
  setPersianToEnglishInput: (text: string) => void;
  setEnglishToPersianInput: (text: string) => void;
  setGrammarInput: (text: string) => void;
  setResults: (results: TranslationResult) => void;
  setSelectedResult: (index: number | null) => void;
  setEditedResults: (results: Partial<TranslationResult>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, details?: string) => void;
  toggleErrorDetails: () => void;
  reset: () => void;
}

export const useTranslationStore = create<TranslationState>((set) => ({
  // Initial state
  persianToEnglishInput: '',
  englishToPersianInput: '',
  grammarInput: '',
  results: null,
  selectedResult: null,
  editedResults: null,
  isLoading: false,
  error: null,
  errorDetails: null,
  showErrorDetails: false,

  // Actions
  setPersianToEnglishInput: (text) =>
    set({
      persianToEnglishInput: text,
      englishToPersianInput: '',
      grammarInput: '',
    }),
  setEnglishToPersianInput: (text) =>
    set({
      englishToPersianInput: text,
      persianToEnglishInput: '',
      grammarInput: '',
    }),
  setGrammarInput: (text) =>
    set({
      grammarInput: text,
      persianToEnglishInput: '',
      englishToPersianInput: '',
    }),
  setResults: (results) =>
    set({
      results,
      selectedResult: 1,
      error: null,
    }),
  setSelectedResult: (index) => set({ selectedResult: index }),
  setEditedResults: (results) => set({ editedResults: results }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error, details) =>
    set({
      error,
      errorDetails: details || null,
    }),
  toggleErrorDetails: () =>
    set((state) => ({ showErrorDetails: !state.showErrorDetails })),
  reset: () =>
    set({
      persianToEnglishInput: '',
      englishToPersianInput: '',
      grammarInput: '',
      results: null,
      selectedResult: null,
      editedResults: null,
      isLoading: false,
      error: null,
      errorDetails: null,
      showErrorDetails: false,
    }),
}));

