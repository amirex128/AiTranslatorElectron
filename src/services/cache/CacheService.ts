import { TranslationResult } from '../../utils/validation';

interface CacheEntry {
  result: TranslationResult;
  timestamp: number;
}

// Simple hash function for browser environment
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

class CacheService {
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    // Load cache from localStorage if available (renderer process)
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('translation-cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.entries(parsed).forEach(([key, value]) => {
            this.cache.set(key, value as CacheEntry);
          });
        }
      } catch (error) {
        console.error('Error loading cache from localStorage:', error);
      }
    }
  }

  private getCacheKey(model: string, userInput: string, systemTemplate: string): string {
    const content = `${model}:${userInput}:${systemTemplate}`;
    return simpleHash(content);
  }

  async get(
    model: string,
    userInput: string,
    systemTemplate: string
  ): Promise<TranslationResult | null> {
    try {
      const cacheKey = this.getCacheKey(model, userInput, systemTemplate);
      const entry = this.cache.get(cacheKey);

      if (entry) {
        return entry.result;
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
      const cacheKey = this.getCacheKey(model, userInput, systemTemplate);
      
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });

      // Save to localStorage if available
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheObject: Record<string, CacheEntry> = {};
        this.cache.forEach((value, key) => {
          cacheObject[key] = value;
        });
        localStorage.setItem('translation-cache', JSON.stringify(cacheObject));
      }
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('translation-cache');
    }
  }
}

export const cacheService = new CacheService();

