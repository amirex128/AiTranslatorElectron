import { create } from 'zustand';
import { TranslationResult } from '../utils/validation';
import { AIModel } from '../models/AIModel';
import { ResponseSuggestionsResult } from '../types/responseSuggestions';

interface TranslationState {
  // Inputs
  persianToEnglishInput: string;
  englishToPersianInput: string;
  grammarInput: string;
  responseSuggestionsInput: string;

  // Results
  results: TranslationResult | null;
  selectedResult: number | null;
  editedResults: Partial<TranslationResult> | null;
  responseSuggestionsResult: ResponseSuggestionsResult | null;

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
  setResponseSuggestionsInput: (text: string) => void;
  setResults: (results: TranslationResult) => void;
  setSelectedResult: (index: number | null) => void;
  setEditedResults: (results: Partial<TranslationResult>) => void;
  setResponseSuggestionsResult: (result: ResponseSuggestionsResult | null) => void;
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
  responseSuggestionsInput: '',
  results: null,
  selectedResult: null,
  editedResults: null,
  responseSuggestionsResult: null,
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
      responseSuggestionsInput: '',
    }),
  setEnglishToPersianInput: (text) =>
    set({
      englishToPersianInput: text,
      persianToEnglishInput: '',
      grammarInput: '',
      responseSuggestionsInput: '',
    }),
  setGrammarInput: (text) =>
    set({
      grammarInput: text,
      persianToEnglishInput: '',
      englishToPersianInput: '',
      responseSuggestionsInput: '',
    }),
  setResponseSuggestionsInput: (text) =>
    set({
      responseSuggestionsInput: text,
      persianToEnglishInput: '',
      englishToPersianInput: '',
      grammarInput: '',
    }),
  setResults: (results) =>
    set({
      results,
      selectedResult: 1,
      error: null,
    }),
  setSelectedResult: (index) => set({ selectedResult: index }),
  setEditedResults: (results) => set({ editedResults: results }),
  setResponseSuggestionsResult: (result) => set({ responseSuggestionsResult: result }),
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
      responseSuggestionsInput: '',
      results: null,
      selectedResult: null,
      editedResults: null,
      responseSuggestionsResult: null,
      isLoading: false,
      error: null,
      errorDetails: null,
      showErrorDetails: false,
    }),
}));

