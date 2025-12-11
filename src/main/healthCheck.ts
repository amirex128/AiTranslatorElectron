import { Ollama } from 'ollama';

export const checkAIProviderConnection = async (
  url: string = 'http://localhost:11434'
): Promise<boolean> => {
  try {
    const client = new Ollama({ host: url });
    await client.list();
    return true;
  } catch (error) {
    console.error('AI Provider health check failed:', error);
    return false;
  }
};

