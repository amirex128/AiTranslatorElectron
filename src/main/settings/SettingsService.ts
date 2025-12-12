import { databaseService } from '../database/DatabaseService';
import { APP_CONFIG } from '../../constants/appConfig';
import { AIModel } from '../../models/AIModel';

export interface AppSettings {
  selectedModel: AIModel;
  aiProviderUrl: string;
  openRouterBaseUrl: string;
  openRouterApiKey1: string;
  openRouterApiKey2: string;
  openRouterReferer: string;
  openRouterSiteName: string;
  temperature: number;
  fontSize: number;
  windowSize: { width: number; height: number };
}

export class SettingsService {
  private cachedSettings: AppSettings | null = null;

  async getSettings(): Promise<AppSettings> {
    // Return cached settings if available
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const dbSettings = await databaseService.getAllSettings();

      // If no settings in database, use defaults from APP_CONFIG
      if (Object.keys(dbSettings).length === 0) {
        this.cachedSettings = {
          selectedModel: APP_CONFIG.selectedModel,
          aiProviderUrl: APP_CONFIG.aiProviderUrl,
          openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
          openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
          openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
          openRouterReferer: APP_CONFIG.openRouterReferer,
          openRouterSiteName: APP_CONFIG.openRouterSiteName,
          temperature: APP_CONFIG.temperature,
          fontSize: APP_CONFIG.fontSize,
          windowSize: APP_CONFIG.windowSize,
        };
        return this.cachedSettings;
      }

      // Parse settings from database
      this.cachedSettings = {
        selectedModel: (dbSettings.selectedModel as AIModel) || APP_CONFIG.selectedModel,
        aiProviderUrl: dbSettings.aiProviderUrl || APP_CONFIG.aiProviderUrl,
        openRouterBaseUrl: dbSettings.openRouterBaseUrl || APP_CONFIG.openRouterBaseUrl,
        openRouterApiKey1: dbSettings.openRouterApiKey1 || APP_CONFIG.openRouterApiKey1,
        openRouterApiKey2: dbSettings.openRouterApiKey2 || APP_CONFIG.openRouterApiKey2,
        openRouterReferer: dbSettings.openRouterReferer || APP_CONFIG.openRouterReferer,
        openRouterSiteName: dbSettings.openRouterSiteName || APP_CONFIG.openRouterSiteName,
        temperature: dbSettings.temperature ? parseFloat(dbSettings.temperature) : APP_CONFIG.temperature,
        fontSize: dbSettings.fontSize ? parseInt(dbSettings.fontSize, 10) : APP_CONFIG.fontSize,
        windowSize: dbSettings.windowSize
          ? JSON.parse(dbSettings.windowSize)
          : APP_CONFIG.windowSize,
      };

      return this.cachedSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return defaults on error
      return {
        selectedModel: APP_CONFIG.selectedModel,
        aiProviderUrl: APP_CONFIG.aiProviderUrl,
        openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
        openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
        openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
        openRouterReferer: APP_CONFIG.openRouterReferer,
        openRouterSiteName: APP_CONFIG.openRouterSiteName,
        temperature: APP_CONFIG.temperature,
        fontSize: APP_CONFIG.fontSize,
        windowSize: APP_CONFIG.windowSize,
      };
    }
  }

  async updateSettings(partial: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...partial };

      // Convert to database format
      const dbSettings: Record<string, string> = {};
      for (const [key, value] of Object.entries(updatedSettings)) {
        if (typeof value === 'object' && value !== null) {
          dbSettings[key] = JSON.stringify(value);
        } else {
          dbSettings[key] = String(value);
        }
      }

      await databaseService.setAllSettings(dbSettings);
      
      // Update cache
      this.cachedSettings = updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  async resetToDefaults(): Promise<void> {
    try {
      // Clear cache
      this.cachedSettings = null;

      // Reset to APP_CONFIG defaults
      const defaultSettings: Record<string, string> = {
        selectedModel: APP_CONFIG.selectedModel,
        aiProviderUrl: APP_CONFIG.aiProviderUrl,
        openRouterBaseUrl: APP_CONFIG.openRouterBaseUrl,
        openRouterApiKey1: APP_CONFIG.openRouterApiKey1,
        openRouterApiKey2: APP_CONFIG.openRouterApiKey2,
        openRouterReferer: APP_CONFIG.openRouterReferer,
        openRouterSiteName: APP_CONFIG.openRouterSiteName,
        temperature: String(APP_CONFIG.temperature),
        fontSize: String(APP_CONFIG.fontSize),
        windowSize: JSON.stringify(APP_CONFIG.windowSize),
      };

      await databaseService.setAllSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings to defaults:', error);
    }
  }

  clearCache(): void {
    this.cachedSettings = null;
  }
}

export const settingsService = new SettingsService();

