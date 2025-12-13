import { databaseService } from '../database/DatabaseService';
import { APP_CONFIG } from '../../constants/appConfig';
import { AIModel } from '../../models/AIModel';
import { AppSettings } from '../../types/settings';
import { getDefaultSettings } from '../../constants/defaultSettings';

export class SettingsService {
  private cachedSettings: AppSettings | null = null;

  async getSettings(): Promise<AppSettings> {
    // Return cached settings if available
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const dbSettings = await databaseService.getAllSettings();

      // If no settings in database, use defaults
      if (Object.keys(dbSettings).length === 0) {
        this.cachedSettings = getDefaultSettings();
        return this.cachedSettings;
      }

      // Parse settings from database
      const defaults = getDefaultSettings();
      this.cachedSettings = {
        selectedModel: (dbSettings.selectedModel as AIModel) || defaults.selectedModel,
        aiProviderUrl: dbSettings.aiProviderUrl || defaults.aiProviderUrl,
        openRouterBaseUrl: dbSettings.openRouterBaseUrl || defaults.openRouterBaseUrl,
        openRouterApiKey1: dbSettings.openRouterApiKey1 || defaults.openRouterApiKey1,
        openRouterApiKey2: dbSettings.openRouterApiKey2 || defaults.openRouterApiKey2,
        openRouterReferer: dbSettings.openRouterReferer || defaults.openRouterReferer,
        openRouterSiteName: dbSettings.openRouterSiteName || defaults.openRouterSiteName,
        temperature: dbSettings.temperature ? parseFloat(dbSettings.temperature) : defaults.temperature,
        fontSize: dbSettings.fontSize ? parseInt(dbSettings.fontSize, 10) : defaults.fontSize,
        windowSize: dbSettings.windowSize
          ? JSON.parse(dbSettings.windowSize)
          : defaults.windowSize,
      };

      return this.cachedSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return defaults on error
      return getDefaultSettings();
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

      // Reset to defaults
      const defaults = getDefaultSettings();
      const defaultSettings: Record<string, string> = {
        selectedModel: defaults.selectedModel,
        aiProviderUrl: defaults.aiProviderUrl,
        openRouterBaseUrl: defaults.openRouterBaseUrl,
        openRouterApiKey1: defaults.openRouterApiKey1,
        openRouterApiKey2: defaults.openRouterApiKey2,
        openRouterReferer: defaults.openRouterReferer,
        openRouterSiteName: defaults.openRouterSiteName,
        temperature: String(defaults.temperature),
        fontSize: String(defaults.fontSize),
        windowSize: JSON.stringify(defaults.windowSize),
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

