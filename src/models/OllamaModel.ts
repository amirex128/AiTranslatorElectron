export enum OllamaModel {
  QWEN3_8B = 'qwen3:8b',
  GEMMA3_12B = 'gemma3:12b',
  LLAMA3_1_8B = 'llama3.1:8b',
  GEMMA3_4B = 'gemma3:4b',
  QWEN3_14B = 'qwen3:14b',
}

export const OLLAMA_MODELS = [
  { value: OllamaModel.QWEN3_8B, label: 'Qwen3 8B' },
  { value: OllamaModel.GEMMA3_12B, label: 'Gemma3 12B' },
  { value: OllamaModel.LLAMA3_1_8B, label: 'Llama3.1 8B' },
  { value: OllamaModel.GEMMA3_4B, label: 'Gemma3 4B' },
  { value: OllamaModel.QWEN3_14B, label: 'Qwen3 14B' },
] as const;

