import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';
import { existsSync, promises as fs } from 'fs';
import { handleIPC } from '../utils';
import { APP_CONFIG } from '../../../constants/appConfig';
import { AppSettings } from '../../../types/settings';
import { AIModel } from '../../../models/AIModel';
import { getEnvFilePath } from '../../utils/envPath';
import { reloadShortcuts } from '../../shortcuts';

/**
 * Write settings to .env file
 */
async function writeEnvFile(settings: AppSettings): Promise<void> {
  const envPath = getEnvFilePath();
  
  // Get model key name from enum value
  const getModelKey = (model: AIModel): string => {
    const modelKey = Object.keys(AIModel).find(
      (key) => AIModel[key as keyof typeof AIModel] === model
    );
    return modelKey || model.toString();
  };

  // Build .env content - preserve existing comments and structure if file exists
  let envContent = '';
  
  try {
    // Try to read existing .env file to preserve comments
    const existingContent = await fs.readFile(envPath, 'utf-8');
    const lines = existingContent.split('\n');
    const newLines: string[] = [];
    
    // Map of keys to update
    const updates = new Map<string, string>([
      ['SELECTED_MODEL', getModelKey(settings.selectedModel)],
      ['AI_PROVIDER_URL', settings.aiProviderUrl],
      ['OPEN_ROUTER_BASE_URL', settings.openRouterBaseUrl],
      ['OPEN_ROUTER_API_KEY_1', settings.openRouterApiKey1],
      ['OPEN_ROUTER_API_KEY_2', settings.openRouterApiKey2],
      ['OPEN_ROUTER_REFERER', settings.openRouterReferer],
      ['OPEN_ROUTER_SITE_NAME', settings.openRouterSiteName],
      ['TEMPERATURE', settings.temperature.toString()],
      ['FONT_SIZE', settings.fontSize.toString()],
      ['WINDOW_WIDTH', settings.windowSize.width.toString()],
      ['WINDOW_HEIGHT', settings.windowSize.height.toString()],
      ['SHORTCUT_PERSIAN_TO_ENGLISH', settings.shortcuts.persianToEnglish],
      ['SHORTCUT_ENGLISH_TO_PERSIAN', settings.shortcuts.englishToPersian],
      ['SHORTCUT_GRAMMAR', settings.shortcuts.grammar],
      ['SHORTCUT_RESPONSE_SUGGESTIONS', settings.shortcuts.responseSuggestions],
    ]);
    
    const updatedKeys = new Set<string>();
    
    // Process existing lines
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Keep comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') {
        newLines.push(line);
        continue;
      }
      
      // Update existing keys
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        if (updates.has(key)) {
          newLines.push(`${key}=${updates.get(key)}`);
          updatedKeys.add(key);
          continue;
        }
      }
      
      // Keep other lines as-is
      newLines.push(line);
    }
    
    // Add any missing keys
    for (const [key, value] of updates.entries()) {
      if (!updatedKeys.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }
    
    envContent = newLines.join('\n');
    if (!envContent.endsWith('\n')) {
      envContent += '\n';
    }
  } catch (error) {
    // File doesn't exist or can't be read, create new one
    console.log('[Settings] Creating new .env file');
    envContent = [
      `SELECTED_MODEL=${getModelKey(settings.selectedModel)}`,
      `AI_PROVIDER_URL=${settings.aiProviderUrl}`,
      `OPEN_ROUTER_BASE_URL=${settings.openRouterBaseUrl}`,
      `OPEN_ROUTER_API_KEY_1=${settings.openRouterApiKey1}`,
      `OPEN_ROUTER_API_KEY_2=${settings.openRouterApiKey2}`,
      `OPEN_ROUTER_REFERER=${settings.openRouterReferer}`,
      `OPEN_ROUTER_SITE_NAME=${settings.openRouterSiteName}`,
      `TEMPERATURE=${settings.temperature}`,
      `FONT_SIZE=${settings.fontSize}`,
      `WINDOW_WIDTH=${settings.windowSize.width}`,
      `WINDOW_HEIGHT=${settings.windowSize.height}`,
      `SHORTCUT_PERSIAN_TO_ENGLISH=${settings.shortcuts.persianToEnglish}`,
      `SHORTCUT_ENGLISH_TO_PERSIAN=${settings.shortcuts.englishToPersian}`,
      `SHORTCUT_GRAMMAR=${settings.shortcuts.grammar}`,
      `SHORTCUT_RESPONSE_SUGGESTIONS=${settings.shortcuts.responseSuggestions}`,
    ].join('\n') + '\n';
  }

  console.log('[Settings] Writing to .env file:', envPath);
  console.log('[Settings] Content preview:', envContent.substring(0, 300) + '...');

  // Ensure directory exists
  const envDir = require('path').dirname(envPath);
  if (!existsSync(envDir)) {
    console.log('[Settings] Creating directory:', envDir);
    await fs.mkdir(envDir, { recursive: true });
  }
  
  // Write to file
  await fs.writeFile(envPath, envContent, 'utf-8');
  console.log('[Settings] Successfully wrote .env file');
  
  // Verify file was written
  const writtenContent = await fs.readFile(envPath, 'utf-8');
  console.log('[Settings] Verification - file size:', writtenContent.length, 'bytes');
  console.log('[Settings] Verification - first line:', writtenContent.split('\n')[0]);
}

/**
 * Registers settings IPC handlers
 */
export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', handleIPC(async () => {
    // Return settings from APP_CONFIG (read from .env in main process)
    return APP_CONFIG as AppSettings;
  }));

  ipcMain.handle('settings:save', handleIPC(async (_event: IpcMainInvokeEvent, settings: AppSettings) => {
    const envPath = getEnvFilePath();
    await writeEnvFile(settings);
    
    // Reload environment variables from the specific .env file
    const dotenv = require('dotenv');
    const result = dotenv.config({ path: envPath, override: true });
    
    if (result.error) {
      console.error('[Settings] Error reloading .env:', result.error);
      throw new Error(`Failed to reload .env: ${result.error.message}`);
    }
    
    console.log('[Settings] Successfully reloaded .env file');
    console.log('[Settings] SELECTED_MODEL after reload:', process.env.SELECTED_MODEL);
    
    // Reload shortcuts with new configuration from the settings that were just saved
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const windowModule = require('../../window');
    if (windowModule.mainWindow && !windowModule.mainWindow.isDestroyed()) {
      reloadShortcuts(windowModule.mainWindow, settings.shortcuts);
      console.log('[Settings] Shortcuts reloaded');
    }
    
    // Return void on success - handleIPC will wrap it in SuccessResponse
    return;
  }));
}

