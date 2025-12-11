import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { OllamaModel } from '../models/OllamaModel';

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
  loadingProgress: number;
  error: string | null;
  errorDetails: string | null;
  showErrorDetails: boolean;

  // Abort controller
  abortController: AbortController | null;

  // Actions
  setPersianToEnglishInput: (text: string) => void;
  setEnglishToPersianInput: (text: string) => void;
  setGrammarInput: (text: string) => void;
  setResults: (results: TranslationResult) => void;
  setSelectedResult: (index: number | null) => void;
  setEditedResults: (results: Partial<TranslationResult>) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null, details?: string) => void;
  toggleErrorDetails: () => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelRequest: () => void;
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
  loadingProgress: 0,
  error: null,
  errorDetails: null,
  showErrorDetails: false,
  abortController: null,

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
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setError: (error, details) =>
    set({
      error,
      errorDetails: details || null,
      isLoading: false,
      loadingProgress: 0,
    }),
  toggleErrorDetails: () =>
    set((state) => ({ showErrorDetails: !state.showErrorDetails })),
  setAbortController: (controller) => set({ abortController: controller }),
  cancelRequest: () => {
    set((state) => {
      if (state.abortController) {
        state.abortController.abort();
      }
      return {
        isLoading: false,
        loadingProgress: 0,
        abortController: null,
      };
    });
  },
  reset: () =>
    set({
      persianToEnglishInput: '',
      englishToPersianInput: '',
      grammarInput: '',
      results: null,
      selectedResult: null,
      editedResults: null,
      isLoading: false,
      loadingProgress: 0,
      error: null,
      errorDetails: null,
      showErrorDetails: false,
      abortController: null,
    }),
}));

