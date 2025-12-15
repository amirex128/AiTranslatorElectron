import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, promises as fs } from 'fs';

interface CacheEntry {
  englishText: string;
  persianTranslation: string;
  timestamp: number;
}

export class QuickTranslateCacheService {
  private assetsPath: string;
  private cachePath: string;
  private initialized = false;

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
      const appPath = app.getAppPath();
      
      // Try app.asar.unpacked first (where unpacked files go)
      const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
      assetsPath = join(unpackedPath, 'src', 'assets');
      
      // If unpacked path doesn't exist, try resources/app/src/assets
      if (!existsSync(assetsPath)) {
        const resourcesPath = join(appPath, '..', '..', 'resources');
        assetsPath = join(resourcesPath, 'app', 'src', 'assets');
      }
      
      // Fallback: if the above doesn't work, use userData/assets
      if (!existsSync(assetsPath)) {
        const userDataPath = app.getPath('userData');
        assetsPath = join(userDataPath, 'assets');
        console.log('[QuickTranslateCache] Using userData/assets as fallback for CSV files');
      }
    }
    
    // Ensure assets directory exists
    if (!existsSync(assetsPath)) {
      mkdirSync(assetsPath, { recursive: true });
    }
    
    this.assetsPath = assetsPath;
    this.cachePath = join(assetsPath, 'quick-translate-cache.csv');
    
    console.log('[QuickTranslateCache] CSV cache file path:', this.cachePath);
  }

  /**
   * Initialize cache file if it doesn't exist
   */
  private async initializeFiles(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize cache.csv if it doesn't exist
      if (!existsSync(this.cachePath)) {
        await fs.writeFile(
          this.cachePath,
          'english_text,persian_translation,timestamp\n',
          'utf-8'
        );
        console.log('[QuickTranslateCache] Created cache file');
      }

      this.initialized = true;
    } catch (error) {
      console.error('[QuickTranslateCache] Error initializing cache file:', error);
    }
  }

  /**
   * Get cached translation for English text
   * @param englishText - English text to look up
   * @returns Cached Persian translation or null if not found
   */
  async getCached(englishText: string): Promise<string | null> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.cachePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 3) {
          const cachedEnglish = this.unescapeCsvField(fields[0]);
          const cachedPersian = this.unescapeCsvField(fields[1]);
          
          // Case-insensitive comparison
          if (cachedEnglish.toLowerCase().trim() === englishText.toLowerCase().trim()) {
            return cachedPersian;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('[QuickTranslateCache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Save translation to cache
   * @param englishText - English text
   * @param persianTranslation - Persian translation
   */
  async saveCache(englishText: string, persianTranslation: string): Promise<void> {
    await this.initializeFiles();

    try {
      // Check if entry already exists
      const existing = await this.getCached(englishText);
      if (existing !== null) {
        // Already cached, skip
        return;
      }

      // Append new entry
      const timestamp = Date.now();
      const escapedEnglish = this.escapeCsvField(englishText);
      const escapedPersian = this.escapeCsvField(persianTranslation);
      
      const line = `${escapedEnglish},${escapedPersian},${timestamp}\n`;
      await fs.appendFile(this.cachePath, line, 'utf-8');
      
      console.log('[QuickTranslateCache] Saved translation to cache');
    } catch (error) {
      console.error('[QuickTranslateCache] Error saving to cache:', error);
    }
  }

  // CSV Helper Methods
  private escapeCsvField(field: string): string {
    // Always wrap in quotes and escape quotes for safety
    return `"${field.replace(/"/g, '""')}"`;
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
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    fields.push(currentField);
    
    return fields;
  }
}

export const quickTranslateCacheService = new QuickTranslateCacheService();

