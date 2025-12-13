import { IPCResponse } from './errors';
import { TranslatorResponse } from './translation';
import { TranslationResult } from '../utils/validation';
import { GrammarTeachingResult } from '../utils/grammarTeachingValidation';
import { AIModel } from '../models/AIModel';
import { AppSettings } from './settings';

interface TranslationParams {
  text: string;
  model: AIModel;
}

interface HistoryEntry {
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar';
  model: AIModel;
  result: TranslationResult;
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
  close: () => Promise<void>;
  show: () => Promise<void>;
  focus: () => Promise<void>;
  onShortcut: (callback: (shortcut: { type: string; text: string }) => void) => void;
  checkAIProvider: (url: string) => Promise<boolean>;
  translatePersianToEnglish: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateEnglishToPersian: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateGrammar: (params: TranslationParams) => Promise<IPCResponse<TranslatorResponse>>;
  translateGrammarTeaching: (params: TranslationParams) => Promise<IPCResponse<{ result: GrammarTeachingResult }>>;
  fetchTTSAudio: (url: string) => Promise<IPCResponse<TTSAudioData>>;
  getCache: (params: { model: string; userInput: string; systemTemplate: string }) => Promise<IPCResponse<TranslationResult | null>>;
  setCache: (params: { model: string; userInput: string; systemTemplate: string; result: TranslationResult }) => Promise<IPCResponse<void>>;
  clearCache: () => Promise<IPCResponse<void>>;
  getAllHistory: () => Promise<IPCResponse<HistoryEntryWithId[]>>;
  addHistory: (entry: HistoryEntry) => Promise<IPCResponse<void>>;
  deleteHistory: (id: string) => Promise<IPCResponse<void>>;
  clearHistory: () => Promise<IPCResponse<void>>;
  getSettings: () => Promise<IPCResponse<AppSettings>>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<IPCResponse<void>>;
  resetSettings: () => Promise<IPCResponse<void>>;
  onSettingsChange: (callback: () => void) => void;
  onSettingsOpenPage: (callback: () => void) => void;
  onAboutOpenPage: (callback: () => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

