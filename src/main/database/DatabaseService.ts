import { app } from 'electron';
import { join } from 'path';
import { existsSync, mkdirSync, promises as fs } from 'fs';
import { TranslationResult } from '../../utils/validation';
import { AIModel } from '../../models/AIModel';
import { GrammarTeachingResult } from '../../services/ai/AIChatService';
import { ResponseSuggestionsResult } from '../../types/responseSuggestions';

interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  type: string;
  model: string;
  result: string;
  responseTime: number | null;
}

export class DatabaseService {
  private assetsPath: string;
  private historyPath: string;
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
      // When files are unpacked, they go to app.asar.unpacked directory
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
    this.historyPath = join(assetsPath, 'history.csv');
    
    console.log('CSV files path:', assetsPath);
  }

  private async initializeFiles(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize history.csv if it doesn't exist
      if (!existsSync(this.historyPath)) {
        await fs.writeFile(this.historyPath, 'id,timestamp,input,type,model,result,responseTime,grammarTeachingResult,responseSuggestionsResult\n', 'utf-8');
      } else {
        // Check if file has old header and migrate
        const content = await fs.readFile(this.historyPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        const firstLine = lines[0] || '';
        
        // Migrate header if needed
        if (firstLine === 'id,timestamp,input,type,model,result,responseTime') {
          // Migrate old CSV to new format by adding grammarTeachingResult and responseSuggestionsResult columns
          lines[0] = 'id,timestamp,input,type,model,result,responseTime,grammarTeachingResult,responseSuggestionsResult';
          // Add empty columns for existing entries
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              lines[i] = lines[i] + ',,';
            }
          }
          await fs.writeFile(this.historyPath, lines.join('\n') + '\n', 'utf-8');
        } else if (firstLine === 'id,timestamp,input,type,model,result,responseTime,grammarTeachingResult') {
          // Migrate to add responseSuggestionsResult column
          lines[0] = 'id,timestamp,input,type,model,result,responseTime,grammarTeachingResult,responseSuggestionsResult';
          // Add empty responseSuggestionsResult for existing entries
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              lines[i] = lines[i] + ',';
            }
          }
          await fs.writeFile(this.historyPath, lines.join('\n') + '\n', 'utf-8');
        }
        
        // Migrate input fields to always be quoted (ensure input is always a string)
        // Check if migration is needed by examining a sample line
        let needsInputMigration = false;
        if (lines.length > 1) {
          // Check first data line to see if input is quoted
          const sampleLine = lines[1];
          const fields = this.parseCsvLine(sampleLine);
          if (fields.length >= 3) {
            // Find the input field position in the raw line
            // Input is the 3rd field (index 2), after id and timestamp
            const firstComma = sampleLine.indexOf(',');
            const secondComma = sampleLine.indexOf(',', firstComma + 1);
            const thirdComma = sampleLine.indexOf(',', secondComma + 1);
            
            if (secondComma !== -1 && thirdComma !== -1) {
              const inputSegment = sampleLine.substring(secondComma + 1, thirdComma).trim();
              // If input doesn't start with quote, migration is needed
              if (!inputSegment.startsWith('"')) {
                needsInputMigration = true;
              }
            }
          }
        }
        
        if (needsInputMigration) {
          console.log('[Database] Migrating input fields to quoted format...');
          const migratedLines = [lines[0]]; // Keep header
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) {
              migratedLines.push(lines[i]);
              continue;
            }
            
            const fields = this.parseCsvLine(lines[i]);
            if (fields.length >= 3) {
              // Re-escape input field to ensure it's always quoted
              const escapedInput = this.escapeCsvField(fields[2]);
              
              // Reconstruct the line with escaped input
              const newFields = [
                this.escapeCsvFieldOptional(fields[0] || ''),
                this.escapeCsvFieldOptional(fields[1] || ''),
                escapedInput, // Always quoted as string
                this.escapeCsvFieldOptional(fields[3] || ''),
                this.escapeCsvFieldOptional(fields[4] || ''),
                this.escapeCsvFieldOptional(fields[5] || ''),
                this.escapeCsvFieldOptional(fields[6] || ''),
                this.escapeCsvFieldOptional(fields[7] || ''),
                this.escapeCsvFieldOptional(fields[8] || '')
              ];
              migratedLines.push(newFields.join(','));
            } else {
              migratedLines.push(lines[i]);
            }
          }
          
          await fs.writeFile(this.historyPath, migratedLines.join('\n') + '\n', 'utf-8');
          console.log('[Database] Input fields migration completed');
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing CSV files:', error);
    }
  }

  // CSV Helper Methods
  private escapeCsvField(field: string): string {
    // Always wrap in quotes and escape quotes for safety
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  private escapeCsvFieldOptional(field: string): string {
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

  // History methods
  async getAllHistory(): Promise<Array<{
    id: string;
    timestamp: number;
    input: string;
    type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
    model: AIModel;
    result: TranslationResult | null;
    grammarTeachingResult?: GrammarTeachingResult;
    responseSuggestionsResult?: ResponseSuggestionsResult;
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
        type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
        model: AIModel;
        result: TranslationResult | null;
        grammarTeachingResult?: GrammarTeachingResult;
        responseSuggestionsResult?: ResponseSuggestionsResult;
        responseTime?: number;
      }> = [];
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const fields = this.parseCsvLine(lines[i]);
        if (fields.length >= 7) {
          const type = fields[3] as 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
          const grammarTeachingResultStr = fields.length >= 8 && fields[7] ? fields[7] : '';
          const responseSuggestionsResultStr = fields.length >= 9 && fields[8] ? fields[8] : '';
          
          let result: TranslationResult | null = null;
          let grammarTeachingResult: GrammarTeachingResult | undefined = undefined;
          let responseSuggestionsResult: ResponseSuggestionsResult | undefined = undefined;
          
          if (type === 'grammar-teaching') {
            // For grammar-teaching, result is null and grammarTeachingResult is parsed
            if (grammarTeachingResultStr) {
              try {
                grammarTeachingResult = JSON.parse(grammarTeachingResultStr) as GrammarTeachingResult;
              } catch (e) {
                console.error('Error parsing grammarTeachingResult:', e);
              }
            }
          } else if (type === 'response-suggestions') {
            // For response-suggestions, result is null and responseSuggestionsResult is parsed
            if (responseSuggestionsResultStr) {
              try {
                responseSuggestionsResult = JSON.parse(responseSuggestionsResultStr) as ResponseSuggestionsResult;
              } catch (e) {
                console.error('Error parsing responseSuggestionsResult:', e);
              }
            }
          } else {
            // For regular translations, parse result
            if (fields[5]) {
              try {
                result = JSON.parse(fields[5]) as TranslationResult;
              } catch (e) {
                console.error('Error parsing result:', e);
              }
            }
          }
          
          entries.push({
            id: fields[0],
            timestamp: parseInt(fields[1], 10),
            input: fields[2],
            type,
            model: fields[4] as AIModel,
            result,
            grammarTeachingResult,
            responseSuggestionsResult,
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
    type: 'persian-to-english' | 'english-to-persian' | 'grammar' | 'grammar-teaching' | 'response-suggestions';
    model: AIModel;
    result: TranslationResult | null;
    grammarTeachingResult?: GrammarTeachingResult;
    responseSuggestionsResult?: ResponseSuggestionsResult;
    responseTime?: number;
  }): Promise<void> {
    try {
      await this.initializeFiles();
      const id = `${Date.now()}-${Math.random()}`;
      const timestamp = Date.now();
      
      const resultStr = entry.result ? JSON.stringify(entry.result) : '';
      const grammarTeachingResultStr = entry.grammarTeachingResult ? JSON.stringify(entry.grammarTeachingResult) : '';
      const responseSuggestionsResultStr = entry.responseSuggestionsResult ? JSON.stringify(entry.responseSuggestionsResult) : '';
      
      // Always escape input field as string (wrap in quotes)
      const escapedInput = this.escapeCsvField(entry.input);
      
      const newEntry = [
        this.escapeCsvFieldOptional(id),
        this.escapeCsvFieldOptional(timestamp.toString()),
        escapedInput, // input is always escaped as string
        this.escapeCsvFieldOptional(entry.type),
        this.escapeCsvFieldOptional(entry.model),
        this.escapeCsvFieldOptional(resultStr),
        this.escapeCsvFieldOptional(entry.responseTime?.toString() || ''),
        this.escapeCsvFieldOptional(grammarTeachingResultStr),
        this.escapeCsvFieldOptional(responseSuggestionsResultStr)
      ].join(',');
      
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
      await fs.writeFile(this.historyPath, 'id,timestamp,input,type,model,result,responseTime,grammarTeachingResult,responseSuggestionsResult\n', 'utf-8');
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  async close(): Promise<void> {
    // No-op for CSV files, but keeping the method for API compatibility
    return Promise.resolve();
  }
}

export const databaseService = new DatabaseService();
