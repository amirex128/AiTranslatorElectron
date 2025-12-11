import { TranslationResult } from '../../utils/validation';

class CacheService {
  async get(
    model: string,
    userInput: string,
    systemTemplate: string
  ): Promise<TranslationResult | null> {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return null;
      }

      const response = await window.electronAPI.getCache({
        model,
        userInput,
        systemTemplate,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  async set(
    model: string,
    userInput: string,
    systemTemplate: string,
    result: TranslationResult
  ): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      await window.electronAPI.setCache({
        model,
        userInput,
        systemTemplate,
        result,
      });
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !window.electronAPI) {
        return;
      }

      await window.electronAPI.clearCache();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}

export const cacheService = new CacheService();

