export enum AIModel {
  // Ollama Models
  QWEN3_8B = 'qwen3:8b',
  GEMMA3_12B = 'gemma3:12b',
  LLAMA3_1_8B = 'llama3.1:8b',
  GEMMA3_4B = 'gemma3:4b',
  QWEN3_14B = 'qwen3:14b',
  // OpenRouter Models
  GEMMA3_27B_IT_OPENROUTER1 = 'google/gemma-3-27b-it:free',
  GEMMA3_27B_IT_OPENROUTER2 = 'google/gemma-3-27b-it:free',
  DEEPSEEK_V3_1_NEX_N1_OPENROUTER1 = 'nex-agi/deepseek-v3.1-nex-n1:free',
  DEEPSEEK_V3_1_NEX_N1_OPENROUTER2 = 'nex-agi/deepseek-v3.1-nex-n1:free',
  DEEPSEEK_R1T2_CHIMERA_OPENROUTER1 = 'tngtech/deepseek-r1t2-chimera:free',
  DEEPSEEK_R1T2_CHIMERA_OPENROUTER2 = 'tngtech/deepseek-r1t2-chimera:free',
  QWEN3_235B_A22B_OPENROUTER1 = 'qwen/qwen3-235b-a22b:free',
  QWEN3_235B_A22B_OPENROUTER2 = 'qwen/qwen3-235b-a22b:free',
  GLM_4_5_AIR_OPENROUTER1 = 'z-ai/glm-4.5-air:free',
  GLM_4_5_AIR_OPENROUTER2 = 'z-ai/glm-4.5-air:free',
  // Google Translate
  GOOGLE_TRANSLATE = 'google-translate',
}

export const AI_MODELS = [
  { key: 'QWEN3_8B', value: AIModel.QWEN3_8B, label: 'Qwen3 8B (Ollama)' },
  { key: 'GEMMA3_12B', value: AIModel.GEMMA3_12B, label: 'Gemma3 12B (Ollama)' },
  { key: 'LLAMA3_1_8B', value: AIModel.LLAMA3_1_8B, label: 'Llama3.1 8B (Ollama)' },
  { key: 'GEMMA3_4B', value: AIModel.GEMMA3_4B, label: 'Gemma3 4B (Ollama)' },
  { key: 'QWEN3_14B', value: AIModel.QWEN3_14B, label: 'Qwen3 14B (Ollama)' },
  { key: 'GEMMA3_27B_IT_OPENROUTER1', value: AIModel.GEMMA3_27B_IT_OPENROUTER1, label: 'Gemma3 27B IT (OpenRouter 1)' },
  { key: 'GEMMA3_27B_IT_OPENROUTER2', value: AIModel.GEMMA3_27B_IT_OPENROUTER2, label: 'Gemma3 27B IT (OpenRouter 2)' },
  { key: 'DEEPSEEK_V3_1_NEX_N1_OPENROUTER1', value: AIModel.DEEPSEEK_V3_1_NEX_N1_OPENROUTER1, label: 'DeepSeek V3.1 Nex N1 (OpenRouter 1)' },
  { key: 'DEEPSEEK_V3_1_NEX_N1_OPENROUTER2', value: AIModel.DEEPSEEK_V3_1_NEX_N1_OPENROUTER2, label: 'DeepSeek V3.1 Nex N1 (OpenRouter 2)' },
  { key: 'DEEPSEEK_R1T2_CHIMERA_OPENROUTER1', value: AIModel.DEEPSEEK_R1T2_CHIMERA_OPENROUTER1, label: 'DeepSeek R1T2 Chimera (OpenRouter 1)' },
  { key: 'DEEPSEEK_R1T2_CHIMERA_OPENROUTER2', value: AIModel.DEEPSEEK_R1T2_CHIMERA_OPENROUTER2, label: 'DeepSeek R1T2 Chimera (OpenRouter 2)' },
  { key: 'QWEN3_235B_A22B_OPENROUTER1', value: AIModel.QWEN3_235B_A22B_OPENROUTER1, label: 'Qwen3 235B A22B (OpenRouter 1)' },
  { key: 'QWEN3_235B_A22B_OPENROUTER2', value: AIModel.QWEN3_235B_A22B_OPENROUTER2, label: 'Qwen3 235B A22B (OpenRouter 2)' },
  { key: 'GLM_4_5_AIR_OPENROUTER1', value: AIModel.GLM_4_5_AIR_OPENROUTER1, label: 'GLM 4.5 Air (OpenRouter 1)' },
  { key: 'GLM_4_5_AIR_OPENROUTER2', value: AIModel.GLM_4_5_AIR_OPENROUTER2, label: 'GLM 4.5 Air (OpenRouter 2)' },
  { key: 'GOOGLE_TRANSLATE', value: AIModel.GOOGLE_TRANSLATE, label: 'Google Translate' },
] as const;

export const isOpenRouterModel = (model: AIModel): boolean => {
  const modelKey = Object.keys(AIModel).find(key => AIModel[key as keyof typeof AIModel] === model);
  return modelKey ? modelKey.includes('OPENROUTER') : false;
};

export const getOpenRouterModelName = (model: AIModel): string => {
  // Return the model name exactly as stored (with :free suffix)
  const modelName = model.toString();
  return modelName;
};

export const getOpenRouterApiKey = (model: AIModel, apiKey1: string, apiKey2: string): string => {
  const modelKey = Object.keys(AIModel).find(key => AIModel[key as keyof typeof AIModel] === model);
  if (modelKey) {
    if (modelKey.endsWith('OPENROUTER1')) {
      return apiKey1;
    } else if (modelKey.endsWith('OPENROUTER2')) {
      return apiKey2;
    }
  }
  return '';
};

