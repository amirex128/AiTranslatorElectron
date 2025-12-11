import { OllamaModel } from '../models/OllamaModel';

export const APP_CONFIG = {
  selectedModel: OllamaModel.QWEN3_8B,
  ollamaUrl: 'http://localhost:11434',
  temperature: 0.7,
  fontSize: 16,
  windowSize: { width: 800, height: 600 },
} as const;

