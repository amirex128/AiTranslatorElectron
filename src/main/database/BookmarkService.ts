import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, promises as fs } from 'fs';
import { TranslationResult } from '../../utils/validation';

export interface ExampleSentence {
  english: string;
  persian: string;
}

export interface Bookmark {
  id: string;
  timestamp: number;
  englishText: string;
  persianTranslation?: string; // ترجمه سریع (Google Translate)
  mainTranslation?: TranslationResult; // ترجمه با مدل اصلی
  fallbackTranslation?: TranslationResult; // ترجمه با مدل جایگزین
  quickTranslation?: string; // ترجمه سریع (Google Translate)
  readCount?: number; // تعداد خواندن (پیش‌فرض: 0)
  mainExamples?: ExampleSentence[]; // 3 مثال با مدل اصلی
  fallbackExamples?: ExampleSentence[]; // 3 مثال با مدل جایگزین
}

interface BookmarkFilters {
  searchQuery?: string;
  sortBy?: 'date' | 'alphabet' | 'readCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export class BookmarkService {
  private assetsPath: string;
  private bookmarkPath: string;
  private initialized = false;

  constructor() {
    // Always use src/assets folder for CSV files (same as DatabaseService)
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
        console.log('[BookmarkService] Using userData/assets as fallback for CSV files');
      }
    }
    
    // Ensure assets directory exists
    if (!existsSync(assetsPath)) {
      mkdirSync(assetsPath, { recursive: true });
    }
    
    this.assetsPath = assetsPath;
    this.bookmarkPath = join(assetsPath, 'bookmarks.csv');
    
    console.log('[BookmarkService] CSV file path:', this.bookmarkPath);
  }

  private async initializeFiles(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize bookmarks.csv if it doesn't exist
      if (!existsSync(this.bookmarkPath)) {
        const header = 'id,timestamp,english_text,persian_translation,main_translation,fallback_translation,quick_translation,read_count\n';
        await fs.writeFile(this.bookmarkPath, header, 'utf-8');
        console.log('[BookmarkService] Created bookmarks.csv file');
      } else {
        // Check if file has old header and migrate
        const content = await fs.readFile(this.bookmarkPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        const firstLine = lines[0] || '';
        
        // Migrate header if needed (add read_count column)
        if (firstLine === 'id,timestamp,english_text,persian_translation,main_translation,fallback_translation,quick_translation') {
          // Migrate old CSV to new format by adding read_count column
          lines[0] = 'id,timestamp,english_text,persian_translation,main_translation,fallback_translation,quick_translation,read_count';
          // Add empty read_count (0) for existing entries
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              lines[i] = lines[i] + ',0';
            }
          }
          await fs.writeFile(this.bookmarkPath, lines.join('\n') + '\n', 'utf-8');
          console.log('[BookmarkService] Migrated bookmarks.csv to include read_count');
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[BookmarkService] Error initializing files:', error);
      throw error;
    }
  }

  private escapeCsvField(field: string | undefined | null): string {
    if (!field) return '""';
    // Always wrap in quotes and escape internal quotes
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
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

  private bookmarkToCsvRow(bookmark: Bookmark): string {
    const fields = [
      bookmark.id,
      bookmark.timestamp.toString(),
      this.escapeCsvField(bookmark.englishText),
      this.escapeCsvField(bookmark.persianTranslation),
      this.escapeCsvField(bookmark.mainTranslation ? JSON.stringify(bookmark.mainTranslation) : undefined),
      this.escapeCsvField(bookmark.fallbackTranslation ? JSON.stringify(bookmark.fallbackTranslation) : undefined),
      this.escapeCsvField(bookmark.quickTranslation),
      (bookmark.readCount ?? 0).toString(),
      this.escapeCsvField(bookmark.mainExamples ? JSON.stringify(bookmark.mainExamples) : undefined),
      this.escapeCsvField(bookmark.fallbackExamples ? JSON.stringify(bookmark.fallbackExamples) : undefined),
    ];
    return fields.join(',');
  }

  private csvRowToBookmark(fields: string[]): Bookmark | null {
    if (fields.length < 3) return null;
    
    try {
      const bookmark: Bookmark = {
        id: fields[0] || '',
        timestamp: parseInt(fields[1] || '0', 10),
        englishText: fields[2] || '',
      };

      if (fields[3]) {
        bookmark.persianTranslation = fields[3];
      }

      if (fields[4]) {
        try {
          bookmark.mainTranslation = JSON.parse(fields[4]) as TranslationResult;
        } catch (e) {
          console.warn('[BookmarkService] Failed to parse mainTranslation:', e);
        }
      }

      if (fields[5]) {
        try {
          bookmark.fallbackTranslation = JSON.parse(fields[5]) as TranslationResult;
        } catch (e) {
          console.warn('[BookmarkService] Failed to parse fallbackTranslation:', e);
        }
      }

      if (fields[6]) {
        bookmark.quickTranslation = fields[6];
      }

      // Parse readCount (field 7, default to 0 if not present)
      if (fields[7]) {
        bookmark.readCount = parseInt(fields[7] || '0', 10);
      } else {
        bookmark.readCount = 0;
      }

      // Parse mainExamples (field 8)
      if (fields[8]) {
        try {
          bookmark.mainExamples = JSON.parse(fields[8]) as ExampleSentence[];
        } catch (e) {
          console.warn('[BookmarkService] Failed to parse mainExamples:', e);
        }
      }

      // Parse fallbackExamples (field 9)
      if (fields[9]) {
        try {
          bookmark.fallbackExamples = JSON.parse(fields[9]) as ExampleSentence[];
        } catch (e) {
          console.warn('[BookmarkService] Failed to parse fallbackExamples:', e);
        }
      }

      return bookmark;
    } catch (error) {
      console.error('[BookmarkService] Error parsing bookmark:', error);
      return null;
    }
  }

  async getAllBookmarks(filters?: BookmarkFilters): Promise<{
    bookmarks: Bookmark[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.bookmarkPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      const bookmarks: Bookmark[] = [];
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        const bookmark = this.csvRowToBookmark(fields);
        if (bookmark) {
          bookmarks.push(bookmark);
        }
      }

      // Apply search filter
      let filteredBookmarks = bookmarks;
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBookmarks = bookmarks.filter(b => 
          b.englishText.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      if (filters?.sortBy) {
        filteredBookmarks.sort((a, b) => {
          let comparison = 0;
          
          if (filters.sortBy === 'date') {
            comparison = a.timestamp - b.timestamp;
          } else if (filters.sortBy === 'alphabet') {
            comparison = a.englishText.localeCompare(b.englishText);
          } else if (filters.sortBy === 'readCount') {
            const aCount = a.readCount ?? 0;
            const bCount = b.readCount ?? 0;
            comparison = aCount - bCount;
          }
          
          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
      } else {
        // Default: sort by date (newest first)
        filteredBookmarks.sort((a, b) => b.timestamp - a.timestamp);
      }

      const total = filteredBookmarks.length;
      const pageSize = filters?.pageSize || 50;
      const page = filters?.page || 1;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedBookmarks = filteredBookmarks.slice(startIndex, endIndex);
      const totalPages = Math.ceil(total / pageSize);

      return {
        bookmarks: paginatedBookmarks,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('[BookmarkService] Error reading bookmarks:', error);
      throw error;
    }
  }

  async getBookmarkById(id: string): Promise<Bookmark | null> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.bookmarkPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        const bookmark = this.csvRowToBookmark(fields);
        if (bookmark && bookmark.id === id) {
          return bookmark;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[BookmarkService] Error getting bookmark by ID:', error);
      throw error;
    }
  }

  async checkBookmark(englishText: string): Promise<Bookmark | null> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.bookmarkPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        const bookmark = this.csvRowToBookmark(fields);
        if (bookmark && bookmark.englishText === englishText) {
          return bookmark;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[BookmarkService] Error checking bookmark:', error);
      throw error;
    }
  }

  async addBookmark(englishText: string): Promise<Bookmark> {
    await this.initializeFiles();

    // Check if bookmark already exists
    const existing = await this.checkBookmark(englishText);
    if (existing) {
      return existing;
    }

    const bookmark: Bookmark = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      englishText,
      readCount: 0,
    };

    try {
      const row = this.bookmarkToCsvRow(bookmark);
      await fs.appendFile(this.bookmarkPath, row + '\n', 'utf-8');
      console.log('[BookmarkService] Added bookmark:', bookmark.id);
      return bookmark;
    } catch (error) {
      console.error('[BookmarkService] Error adding bookmark:', error);
      throw error;
    }
  }

  async removeBookmark(id: string): Promise<boolean> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.bookmarkPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const header = lines[0];
      const newLines = [header];
      
      let found = false;
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields[0] !== id) {
          newLines.push(lines[i]);
        } else {
          found = true;
        }
      }
      
      if (found) {
        await fs.writeFile(this.bookmarkPath, newLines.join('\n') + '\n', 'utf-8');
        console.log('[BookmarkService] Removed bookmark:', id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[BookmarkService] Error removing bookmark:', error);
      throw error;
    }
  }

  async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<Bookmark | null> {
    await this.initializeFiles();

    try {
      const content = await fs.readFile(this.bookmarkPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      const header = lines[0];
      const newLines = [header];
      let updatedBookmark: Bookmark | null = null;
      
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        const bookmark = this.csvRowToBookmark(fields);
        
        if (bookmark && bookmark.id === id) {
          // Update bookmark
          updatedBookmark = {
            ...bookmark,
            ...updates,
            id: bookmark.id, // Preserve ID
            timestamp: bookmark.timestamp, // Preserve timestamp unless explicitly updated
          };
          if (updates.timestamp !== undefined) {
            updatedBookmark.timestamp = updates.timestamp;
          }
          newLines.push(this.bookmarkToCsvRow(updatedBookmark));
        } else {
          newLines.push(lines[i]);
        }
      }
      
      if (updatedBookmark) {
        await fs.writeFile(this.bookmarkPath, newLines.join('\n') + '\n', 'utf-8');
        console.log('[BookmarkService] Updated bookmark:', id);
        return updatedBookmark;
      }
      
      return null;
    } catch (error) {
      console.error('[BookmarkService] Error updating bookmark:', error);
      throw error;
    }
  }
}

export const bookmarkService = new BookmarkService();

