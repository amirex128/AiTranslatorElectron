import { IPCResponse } from './errors';
import { TranslatorResponse } from './translation';
import { TranslationResult } from '../utils/validation';
import { GrammarTeachingResult } from '../services/ai/AIChatService';
import { AIModel } from '../models/AIModel';
import { AppSettings } from './settings';
import { ResponseSuggestionsResult } from './responseSuggestions';

interface TranslationParams {
  text: string;
  model: AIModel;
}

interface HistoryEntry {
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
  model: AIModel;
  result: TranslationResult | null; // null for grammar-teaching and response-suggestions
  grammarTeachingResult?: GrammarTeachingResult; // Only for grammar-teaching type
  responseSuggestionsResult?: ResponseSuggestionsResult; // Only for response-suggestions type
  responseTime?: number;
}

interface HistoryEntryWithId extends HistoryEntry {
  id: string;
  timestamp: number;
}

interface TTSAudioData {
  data: string;
  mimeType: string;
}

export interface ElectronAPI {
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<boolean>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  restore: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  close: () => Promise<void>;
  show: () => Promise<void>;
  focus: () => Promise<void>;
  onShortcut: (callback: (shortcut: { type: string; text: string }) => void) => void;
  checkAIProvider: (url: string) => Promise<boolean>;
  translatePersianToEnglish: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateEnglishToPersian: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateGrammar: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateGrammarTeaching: (params: TranslationParams) => Promise<IPCResponse<{ result: GrammarTeachingResult }>>;
  translateResponseSuggestions: (params: TranslationParams) => Promise<IPCResponse<{ result: ResponseSuggestionsResult }>>;
  fetchTTSAudio: (url: string) => Promise<IPCResponse<TTSAudioData>>;
  getAllHistory: () => Promise<IPCResponse<HistoryEntryWithId[]>>;
  addHistory: (entry: HistoryEntry) => Promise<IPCResponse<void>>;
  deleteHistory: (id: string) => Promise<IPCResponse<void>>;
  clearHistory: () => Promise<IPCResponse<void>>;
  getSettings: () => Promise<IPCResponse<AppSettings>>;
  saveSettings: (settings: AppSettings) => Promise<IPCResponse<void>>;
  openSettings: () => void;
  openAbout: () => void;
  clearHistoryWithConfirmation: () => Promise<IPCResponse<{ confirmed: boolean }>>;
  openDevTools: () => Promise<void>;
  onSettingsOpenPage: (callback: () => void) => void;
  onAboutOpenPage: (callback: () => void) => void;
  isSpeechRecognitionAvailable: () => Promise<IPCResponse<boolean>>;
  startSpeechRecognition: () => Promise<IPCResponse<{ success: boolean }>>;
  stopSpeechRecognition: () => Promise<IPCResponse<{ success: boolean }>>;
  getSpeechRecognitionStatus: () => Promise<IPCResponse<{ isListening: boolean }>>;
  onSpeechStatus: (callback: (status: { isListening: boolean }) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

