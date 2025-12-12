import * as sqlite3 from 'sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { TranslationResult } from '../../utils/validation';
import { AIModel } from '../../models/AIModel';
import { promisify } from 'util';

export class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = join(userDataPath, 'translator.db');
  }

  private async getDatabase(): Promise<sqlite3.Database> {
    if (!this.db) {
      this.db = new sqlite3.Database(this.dbPath, (err: Error | null) => {
        if (err) {
          console.error('Error opening database:', err);
        }
      });
      await this.initializeDatabase();
    }
    return this.db;
  }

  private async initializeDatabase(): Promise<void> {
    if (this.initialized || !this.db) return;

    const run = promisify(this.db.run.bind(this.db));

    try {
      // Create cache table
      await run(`
        CREATE TABLE IF NOT EXISTS cache (
          id TEXT PRIMARY KEY,
          model TEXT NOT NULL,
          userInput TEXT NOT NULL,
          systemTemplate TEXT NOT NULL,
          result TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          cacheKey TEXT NOT NULL UNIQUE
        )
      `);

      // Create index on cacheKey for faster lookups
      await run(`
        CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cacheKey)
      `);

      // Create history table
      await run(`
        CREATE TABLE IF NOT EXISTS history (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          input TEXT NOT NULL,
          type TEXT NOT NULL,
          model TEXT NOT NULL,
          result TEXT NOT NULL,
          responseTime INTEGER
        )
      `);

      // Create index on timestamp for faster sorting
      await run(`
        CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)
      `);

      // Create settings table
      await run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // Cache methods
  async getCache(model: string, userInput: string, systemTemplate: string): Promise<TranslationResult | null> {
    try {
      const db = await this.getDatabase();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);

      const get = promisify(db.get.bind(db));
      const row = await get('SELECT result FROM cache WHERE cacheKey = ?', [cacheKey]) as { result: string } | undefined;

      if (row) {
        return JSON.parse(row.result) as TranslationResult;
      }

      return null;
    } catch (error) {
      console.error('Error reading cache from database:', error);
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
      const db = await this.getDatabase();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);
      const id = `${Date.now()}-${Math.random()}`;

      const run = promisify(db.run.bind(db));
      await run(
        `INSERT OR REPLACE INTO cache (id, model, userInput, systemTemplate, result, timestamp, cacheKey)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, model, userInput, systemTemplate, JSON.stringify(result), Date.now(), cacheKey]
      );
    } catch (error) {
      console.error('Error writing cache to database:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = await this.getDatabase();
      const run = promisify(db.run.bind(db));
      await run('DELETE FROM cache');
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
      const db = await this.getDatabase();
      const all = promisify(db.all.bind(db));
      const rows = await all('SELECT * FROM history ORDER BY timestamp DESC') as Array<{
        id: string;
        timestamp: number;
        input: string;
        type: string;
        model: string;
        result: string;
        responseTime: number | null;
      }>;

      return rows.map((row) => ({
        id: row.id,
        timestamp: row.timestamp,
        input: row.input,
        type: row.type as 'persian-to-english' | 'english-to-persian' | 'grammar',
        model: row.model as AIModel,
        result: JSON.parse(row.result) as TranslationResult,
        responseTime: row.responseTime ?? undefined,
      }));
    } catch (error) {
      console.error('Error reading history from database:', error);
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
      const db = await this.getDatabase();
      const id = `${Date.now()}-${Math.random()}`;
      const timestamp = Date.now();

      const run = promisify(db.run.bind(db));
      await run(
        `INSERT INTO history (id, timestamp, input, type, model, result, responseTime)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, timestamp, entry.input, entry.type, entry.model, JSON.stringify(entry.result), entry.responseTime ?? null]
      );
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    try {
      const db = await this.getDatabase();
      const run = promisify(db.run.bind(db));
      await run('DELETE FROM history WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      const db = await this.getDatabase();
      const run = promisify(db.run.bind(db));
      await run('DELETE FROM history');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<string | null> {
    try {
      const db = await this.getDatabase();
      const get = promisify(db.get.bind(db));
      const row = await get('SELECT value FROM settings WHERE key = ?', [key]) as { value: string } | undefined;

      if (row) {
        return row.value;
      }

      return null;
    } catch (error) {
      console.error('Error reading setting from database:', error);
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDatabase();
      const run = promisify(db.run.bind(db));
      await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    } catch (error) {
      console.error('Error writing setting to database:', error);
    }
  }

  async getAllSettings(): Promise<Record<string, string>> {
    try {
      const db = await this.getDatabase();
      const all = promisify(db.all.bind(db));
      const rows = await all('SELECT key, value FROM settings') as Array<{ key: string; value: string }>;

      const settings: Record<string, string> = {};
      rows.forEach((row) => {
        settings[row.key] = row.value;
      });

      return settings;
    } catch (error) {
      console.error('Error reading all settings from database:', error);
      return {};
    }
  }

  async setAllSettings(settings: Record<string, string>): Promise<void> {
    try {
      const db = await this.getDatabase();
      const run = promisify(db.run.bind(db));

      // Use a transaction for better performance
      await run('BEGIN TRANSACTION');
      try {
        for (const [key, value] of Object.entries(settings)) {
          await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
        }
        await run('COMMIT');
      } catch (error) {
        await run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error writing all settings to database:', error);
    }
  }

  async initializeSettingsFromConfig(defaultConfig: Record<string, any>): Promise<void> {
    try {
      const existingSettings = await this.getAllSettings();

      // Only initialize if settings table is empty
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
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export const databaseService = new DatabaseService();
