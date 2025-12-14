import { Ollama } from 'ollama';

export const checkAIProviderConnection = async (
  url = 'http://localhost:11434'
): Promise<boolean> => {
  try {
    const client = new Ollama({ host: url });
    await client.list();
    return true;
  } catch (error) {
    // Connection errors are expected if Ollama is not running
    // This is a warning, not an error - the app will continue to work
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      // Silently return false for connection refused errors
      return false;
    }
    // Log other unexpected errors
    console.warn('AI Provider health check failed:', errorMessage);
    return false;
  }
};

