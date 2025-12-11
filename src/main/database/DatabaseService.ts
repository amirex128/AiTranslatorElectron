import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { TranslationResult } from '../../utils/validation';
import { AIModel } from '../../models/AIModel';

interface CacheEntry {
  id: string;
  model: string;
  userInput: string;
  systemTemplate: string;
  result: string; // JSON string of TranslationResult
  timestamp: number;
  cacheKey: string;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: 'persian-to-english' | 'english-to-persian' | 'grammar';
  model: string;
  result: string; // JSON string of TranslationResult
  responseTime: number | null;
}

export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = join(userDataPath, 'translator.db');
  }

  private getDatabase(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.initializeDatabase();
    }
    return this.db;
  }

  private initializeDatabase(): void {
    if (!this.db) return;

    // Create cache table
    this.db.exec(`
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
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cache_key ON cache(cacheKey)
    `);

    // Create history table
    this.db.exec(`
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
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC)
    `);
  }

  // Cache methods
  getCache(model: string, userInput: string, systemTemplate: string): TranslationResult | null {
    try {
      const db = this.getDatabase();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);

      const stmt = db.prepare('SELECT result FROM cache WHERE cacheKey = ?');
      const row = stmt.get(cacheKey) as { result: string } | undefined;

      if (row) {
        return JSON.parse(row.result) as TranslationResult;
      }

      return null;
    } catch (error) {
      console.error('Error reading cache from database:', error);
      return null;
    }
  }

  setCache(
    model: string,
    userInput: string,
    systemTemplate: string,
    result: TranslationResult
  ): void {
    try {
      const db = this.getDatabase();
      const cacheKey = this.generateCacheKey(model, userInput, systemTemplate);
      const id = `${Date.now()}-${Math.random()}`;

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO cache (id, model, userInput, systemTemplate, result, timestamp, cacheKey)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        model,
        userInput,
        systemTemplate,
        JSON.stringify(result),
        Date.now(),
        cacheKey
      );
    } catch (error) {
      console.error('Error writing cache to database:', error);
    }
  }

  clearCache(): void {
    try {
      const db = this.getDatabase();
      db.exec('DELETE FROM cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // History methods
  getAllHistory(): Array<{
    id: string;
    timestamp: number;
    input: string;
    type: 'persian-to-english' | 'english-to-persian' | 'grammar';
    model: AIModel;
    result: TranslationResult;
    responseTime?: number;
  }> {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare('SELECT * FROM history ORDER BY timestamp DESC');
      const rows = stmt.all() as Array<{
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

  addHistoryEntry(entry: {
    input: string;
    type: 'persian-to-english' | 'english-to-persian' | 'grammar';
    model: AIModel;
    result: TranslationResult;
    responseTime?: number;
  }): void {
    try {
      const db = this.getDatabase();
      const id = `${Date.now()}-${Math.random()}`;
      const timestamp = Date.now();

      const stmt = db.prepare(`
        INSERT INTO history (id, timestamp, input, type, model, result, responseTime)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        timestamp,
        entry.input,
        entry.type,
        entry.model,
        JSON.stringify(entry.result),
        entry.responseTime ?? null
      );
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  }

  deleteHistoryEntry(id: string): void {
    try {
      const db = this.getDatabase();
      const stmt = db.prepare('DELETE FROM history WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      console.error('Error deleting history entry:', error);
    }
  }

  clearHistory(): void {
    try {
      const db = this.getDatabase();
      db.exec('DELETE FROM history');
    } catch (error) {
      console.error('Error clearing history:', error);
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

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const databaseService = new DatabaseService();

