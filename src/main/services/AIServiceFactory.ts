import { AITranslatorService } from '../../services/ai/AITranslatorService';
import { AppSettings } from '../../types/settings';

/**
 * Factory for creating and managing AI service instances
 */
export class AIServiceFactory {
  private aiService: AITranslatorService | null = null;

  /**
   * Creates or updates the AI service with the given settings
   */
  createService(settings: AppSettings): AITranslatorService {
    this.aiService = new AITranslatorService({
      aiProviderUrl: settings.aiProviderUrl,
      temperature: settings.temperature,
      openRouterBaseUrl: settings.openRouterBaseUrl,
      openRouterApiKey1: settings.openRouterApiKey1,
      openRouterApiKey2: settings.openRouterApiKey2,
      openRouterReferer: settings.openRouterReferer,
      openRouterSiteName: settings.openRouterSiteName,
    });
    return this.aiService;
  }

  /**
   * Gets the current AI service instance, or null if not initialized
   */
  getService(): AITranslatorService | null {
    return this.aiService;
  }

  /**
   * Updates the AI service with new settings
   */
  updateService(settings: AppSettings): AITranslatorService {
    return this.createService(settings);
  }
}

