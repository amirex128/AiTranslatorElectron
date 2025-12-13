import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import { TranslationResult } from '../../utils/validation';
import { AIModel } from '../../models/AIModel';

interface CacheEntry {
  id: string;
  model: string;
  userInput: string;
  systemTemplate: string;
  result: string;
  timestamp: number;
  cacheKey: string;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: string;
  model: string;
  result: string;
  responseTime: number | null;
}

interface SettingEntry {
  key: string;
  value: string;
}

export class DatabaseService {
  private assetsPath: string;
  private cachePath: string;
  private historyPath: string;
  private settingsPath: string;
  private initialized: boolean = false;

  constructor() {
    // Always use src/assets folder for CSV files
    const isDev = !app.isPackaged;
    
    let assetsPath: string;
    if (isDev) {
      // In development, use src/assets directly from project root
      const appPath = app.getAppPath();
      assetsPath = join(appPath, 'src', 'assets');
    } else {
      // In production, assets are unpacked from asar
      // When files are unpacked, they go to app.asar.unpacked directory
      const appPath = app.getAppPath();
      
      // Try app.asar.unpacked first (where unpacked files go)
      let unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
      assetsPath = join(unpackedPath, 'src', 'assets');
      
      // If unpacked path doesn't exist, try resources/app/src/assets
      if (!existsSync(assetsPath)) {
        const resourcesPath = join(appPath, '..', '..', 'resources');
        assetsPath = join(resourcesPath, 'app', 'src', 'assets');
      }
      
      // Fallback: if the above doesn't work, use userData/assets
      // This ensures the CSV files are always accessible and writable
      if (!existsSync(assetsPath)) {
        const userDataPath = app.getPath('userData');
        assetsPath = join(userDataPath, 'assets');
        console.log('Using userData/assets as fallback for CSV files');
      }
    }
    
    // Ensure assets directory exists
    if (!existsSync(assetsPath)) {
      mkdirSync(assetsPath, { recursive: true });
    }
    
    this.assetsPath = assetsPath;
    this.cachePath = join(assetsPath, 'cache.csv');
    this.historyPath = join(assetsPath, 'history.csv');
    this.settingsPath = join(assetsPath, 'settings.csv');
    
    console.log('CSV files path:', assetsPath);
  }

  private async initializeFiles(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize cache.csv if it doesn't exist
      if (!existsSync(this.cachePath)) {
        await fs.writeFile(this.cachePath, 'id,model,userInput,systemTemplate,result,timestamp,cacheKey\n', 'utf-8');
      }

      // Initialize history.csv if it doesn't exist
      if (!existsSync(this.historyPath)) {
        await fs.writeFile(this.historyPath, 'id,timestamp,input,type,model,result,responseTime\n', 'utf-8');
      }

      // Initialize settings.csv if it doesn't exist
      if (!existsSync(this.settingsPath)) {
        await fs.writeFile(this.settingsPath, 'key,value\n', 'utf-8');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing CSV files:', error);
    }
  }

  // CSV Helper Methods
  private escapeCsvField(field: string): string {
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private unescapeCsvField(field: string): string {
    // Remove surrounding quotes if present and unescape double quotes
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"');
    }
    return field;
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(this.unescapeCsvField(currentField));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    fields.push(this.unescapeCsvField(currentField));
    return fields;
  }

  // Cache methods
  async getCache(model: string, userInput: string, systemTemplate: string): Promise<TranslationResult | null> {
    try {
      await this.initializeFiles();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);
      
      const content = await fs.readFile(this.cachePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 7 && fields[6] === cacheKey) {
          return JSON.parse(fields[4]) as TranslationResult;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading cache from CSV:', error);
      return null;
    }
  }

  async setCache(
    model: string,
    userInput: string,
    systemTemplate: string,
    result: TranslationResult
  ): Promise<void> {
    try {
      await this.initializeFiles();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);
      const id = `${Date.now()}-${Math.random()}`;
      
      // Read existing cache
      const content = await fs.readFile(this.cachePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Remove existing entry with same cacheKey if exists
      const filteredLines = lines.filter((line, index) => {
        if (index === 0) return true; // Keep header
        const fields = this.parseCsvLine(line);
        return fields.length >= 7 && fields[6] !== cacheKey;
      });
      
      // Add new entry
      const newEntry = [
        id,
        model,
        userInput,
        systemTemplate,
        JSON.stringify(result),
        Date.now().toString(),
        cacheKey
      ].map(field => this.escapeCsvField(field)).join(',');
      
      filteredLines.push(newEntry);
      await fs.writeFile(this.cachePath, filteredLines.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('Error writing cache to CSV:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.initializeFiles();
      await fs.writeFile(this.cachePath, 'id,model,userInput,systemTemplate,result,timestamp,cacheKey\n', 'utf-8');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // History methods
  async getAllHistory(): Promise<Array<{
    id: string;
    timestamp: number;
    input: string;
    type: 'persian-to-english' | 'english-to-persian' | 'grammar';
    model: AIModel;
    result: TranslationResult;
    responseTime?: number;
  }>> {
    try {
      await this.initializeFiles();
      const content = await fs.readFile(this.historyPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const entries: Array<{
        id: string;
        timestamp: number;
        input: string;
        type: 'persian-to-english' | 'english-to-persian' | 'grammar';
        model: AIModel;
        result: TranslationResult;
        responseTime?: number;
      }> = [];
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 7) {
          entries.push({
            id: fields[0],
            timestamp: parseInt(fields[1], 10),
            input: fields[2],
            type: fields[3] as 'persian-to-english' | 'english-to-persian' | 'grammar',
            model: fields[4] as AIModel,
            result: JSON.parse(fields[5]) as TranslationResult,
            responseTime: fields[6] ? parseInt(fields[6], 10) : undefined,
          });
        }
      }
      
      // Sort by timestamp descending
      entries.sort((a, b) => b.timestamp - a.timestamp);
      
      return entries;
    } catch (error) {
      console.error('Error reading history from CSV:', error);
      return [];
    }
  }

  async addHistoryEntry(entry: {
    input: string;
    type: 'persian-to-english' | 'english-to-persian' | 'grammar';
    model: AIModel;
    result: TranslationResult;
    responseTime?: number;
  }): Promise<void> {
    try {
      await this.initializeFiles();
      const id = `${Date.now()}-${Math.random()}`;
      const timestamp = Date.now();
      
      const newEntry = [
        id,
        timestamp.toString(),
        entry.input,
        entry.type,
        entry.model,
        JSON.stringify(entry.result),
        entry.responseTime?.toString() || ''
      ].map(field => this.escapeCsvField(field)).join(',');
      
      // Append to file
      await fs.appendFile(this.historyPath, newEntry + '\n', 'utf-8');
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    try {
      await this.initializeFiles();
      const content = await fs.readFile(this.historyPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Filter out the entry with matching id
      const filteredLines = lines.filter((line, index) => {
        if (index === 0) return true; // Keep header
        const fields = this.parseCsvLine(line);
        return fields.length > 0 && fields[0] !== id;
      });
      
      await fs.writeFile(this.historyPath, filteredLines.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await this.initializeFiles();
      await fs.writeFile(this.historyPath, 'id,timestamp,input,type,model,result,responseTime\n', 'utf-8');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    try {
      await this.initializeFiles();
      const content = await fs.readFile(this.settingsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 2 && fields[0] === key) {
          return fields[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error reading setting from CSV:', error);
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    try {
      await this.initializeFiles();
      const content = await fs.readFile(this.settingsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Remove existing entry with same key if exists
      const filteredLines = lines.filter((line, index) => {
        if (index === 0) return true; // Keep header
        const fields = this.parseCsvLine(line);
        return fields.length === 0 || fields[0] !== key;
      });
      
      // Add new entry
      const newEntry = [key, value].map(field => this.escapeCsvField(field)).join(',');
      filteredLines.push(newEntry);
      
      await fs.writeFile(this.settingsPath, filteredLines.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('Error writing setting to CSV:', error);
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      await this.initializeFiles();
      const content = await fs.readFile(this.settingsPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const settings: Record<string, string> = {};
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 2) {
          settings[fields[0]] = fields[1];
        }
      }
      
      return settings;
    } catch (error) {
      console.error('Error reading all settings from CSV:', error);
      return {};
    }
  }

  async setAllSettings(settings: Record<string, string>): Promise<void> {
    try {
      await this.initializeFiles();
      // Read existing settings to preserve any not in the new settings object
      const existingSettings = await this.getAllSettings();
      
      // Merge with new settings (new settings override existing)
      const mergedSettings = { ...existingSettings, ...settings };
      
      // Write all settings
      const lines = ['key,value'];
      for (const [key, value] of Object.entries(mergedSettings)) {
        const entry = [key, value].map(field => this.escapeCsvField(field)).join(',');
        lines.push(entry);
      }
      
      await fs.writeFile(this.settingsPath, lines.join('\n') + '\n', 'utf-8');
    } catch (error) {
      console.error('Error writing all settings to CSV:', error);
    }
  }

  async initializeSettingsFromConfig(defaultConfig: Record<string, any>): Promise<void> {
    try {
      const existingSettings = await this.getAllSettings();

      // Only initialize if settings are empty
      if (Object.keys(existingSettings).length === 0) {
        const settingsToSave: Record<string, string> = {};
        
        for (const [key, value] of Object.entries(defaultConfig)) {
          if (typeof value === 'object' && value !== null) {
            settingsToSave[key] = JSON.stringify(value);
          } else {
            settingsToSave[key] = String(value);
          }
        }

        await this.setAllSettings(settingsToSave);
      }
    } catch (error) {
      console.error('Error initializing settings from config:', error);
    }
  }

  // Helper method
  private generateCacheKey(model: string, userInput: string, systemTemplate: string): string {
    const content = `${model}:${userInput}:${systemTemplate}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  async close(): Promise<void> {
    // No-op for CSV files, but keeping the method for API compatibility
    return Promise.resolve();
  }
}

export const databaseService = new DatabaseService();
