import { Ollama } from 'ollama';

export const checkOllamaConnection = async (
  url: string = 'http://localhost:11434'
): Promise<boolean> => {
  try {
    const client = new Ollama({ host: url });
    await client.list();
    return true;
  } catch (error) {
    console.error('Ollama health check failed:', error);
    return false;
  }
};

