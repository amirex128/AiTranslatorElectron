import Store from 'electron-store';
import { AIModel } from '../models/AIModel';

interface StoreSchema {
  settings?: Partial<AppSettings>;
}

const store = new Store<StoreSchema>() as any;

export interface AppSettings {
  selectedModel: AIModel;
  aiProviderUrl: string;
  temperature: number;
  fontSize: number;
}

const defaultSettings: AppSettings = {
  selectedModel: AIModel.QWEN3_8B,
  aiProviderUrl: 'http://localhost:11434',
  temperature: 0.7,
  fontSize: 16,
};

export const getSettings = (): AppSettings => {
  const stored = store.get('settings', {}) as Partial<AppSettings>;
  return { ...defaultSettings, ...stored };
};

export const setSettings = (settings: Partial<AppSettings>): void => {
  const current = getSettings();
  const updated = { ...current, ...settings };
  store.set('settings', updated);
};

