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

  /**
   * Try to fix common JSON issues like missing closing braces or quotes
   * @param jsonStr - Potentially malformed JSON string
   * @returns Fixed JSON string or null if cannot be fixed
   */
  private tryFixJson(jsonStr: string): string | null {
    try {
      if (!jsonStr || jsonStr.trim().length === 0) {
        return null;
      }

      // Count opening and closing braces
      const openBraces = (jsonStr.match(/{/g) || []).length;
      const closeBraces = (jsonStr.match(/}/g) || []).length;
      
      let fixed = jsonStr.trim();
      
      // Fix incomplete trailing properties (like "english_3:"" or english_3:"")
      // This pattern matches incomplete properties at the end of the JSON string
      // Examples: ,"english_3:"" or ,english_3:"" or ,"english_3":"" or ,english_3:""
      // Handle pattern: "english_3:"" (property name with colon and empty quotes)
      fixed = fixed.replace(/,\s*"[^"]*:\s*""\s*$/, ''); // Remove "property:"" at end (with quotes)
      fixed = fixed.replace(/,\s*"[^"]*":\s*""\s*$/, ''); // Remove "property":"" at end (with quotes around property)
      fixed = fixed.replace(/,\s*"[^"]*:\s*""?\s*$/, ''); // Remove "property:"" at end (more flexible)
      fixed = fixed.replace(/,\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*""?\s*$/, ''); // Remove property:"" at end (no quotes)
      fixed = fixed.replace(/,\s*"[^"]*:\s*$/, ''); // Remove "property: at end
      fixed = fixed.replace(/,\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*$/, ''); // Remove property: at end
      
      // Fix incomplete properties in the middle (like "english_3:"" followed by comma or brace)
      // This handles cases where the property value is incomplete
      // Pattern: "english_3":"" - property with empty string value
      fixed = fixed.replace(/("[^"]*"):\s*""\s*([,}])/g, '$1: ""$2'); // Fix "prop":"" to "prop": ""
      fixed = fixed.replace(/("[^"]*"):\s*""?\s*([,}])/g, '$1: ""$2'); // More flexible version
      fixed = fixed.replace(/([a-zA-Z_][a-zA-Z0-9_]*):\s*""?\s*([,}])/g, '"$1": ""$2'); // Fix prop:"" to "prop": ""
      
      // Handle the specific pattern "english_3:"" that appears in the error
      // This is a property name without quotes around it, followed by colon and empty quotes
      fixed = fixed.replace(/,\s*"([^"]*):\s*""\s*([,}])/g, ''); // Remove ,"prop:"" followed by comma or brace
      fixed = fixed.replace(/,\s*"([^"]*):\s*""\s*$/, ''); // Remove ,"prop:"" at end
      
      // Remove any trailing incomplete property definitions
      // Match patterns like: ,"english_3":"" or ,english_3:"" at the end
      fixed = fixed.replace(/,\s*"[^"]*":\s*""\s*$/, ''); // Remove ,"prop":"" at end
      fixed = fixed.replace(/,\s*"[^"]*":\s*""?\s*$/, ''); // More flexible
      fixed = fixed.replace(/,\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*""?\s*$/, ''); // Remove ,prop:"" at end
      
      // If missing closing braces, try to add them
      if (openBraces > closeBraces) {
        const missingBraces = openBraces - closeBraces;
        // Add missing closing braces
        fixed += '}'.repeat(missingBraces);
      }
      
      // If missing opening braces (unlikely but possible)
      if (closeBraces > openBraces) {
        const missingBraces = closeBraces - openBraces;
        fixed = '{'.repeat(missingBraces) + fixed;
      }
      
      // Ensure it ends with a closing brace if it starts with an opening brace
      if (fixed.startsWith('{') && !fixed.endsWith('}')) {
        // Check if there's a trailing comma before adding the brace
        if (fixed.endsWith(',')) {
          fixed = fixed.slice(0, -1) + '}';
        } else {
          fixed += '}';
        }
      }
      
      // Remove trailing comma before closing brace (common JSON error)
      fixed = fixed.replace(/,\s*}/g, '}');
      fixed = fixed.replace(/,\s*]/g, ']');
      
      // Validate the fixed JSON
      try {
        const parsed = JSON.parse(fixed);
        // Additional validation: ensure it's an object
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return fixed;
        }
        return null;
      } catch (parseError) {
        // If still invalid, try more aggressive fixes
        
        // Fix 1: Remove the last incomplete property (handles cases where JSON was cut off)
        const lastCommaIndex = fixed.lastIndexOf(',');
        if (lastCommaIndex > 0 && lastCommaIndex < fixed.length - 2) {
          const afterLastComma = fixed.substring(lastCommaIndex + 1).trim();
          // Match patterns like: "english_3:"" or "english_3":"" or english_3:""
          if (afterLastComma.match(/^"[^"]*:\s*""?\s*$/) || 
              afterLastComma.match(/^"[^"]*":\s*""?\s*$/) ||
              afterLastComma.match(/^[a-zA-Z_][a-zA-Z0-9_]*:\s*""?\s*$/)) {
            // Remove the incomplete property
            let testFixed = fixed.substring(0, lastCommaIndex);
            if (!testFixed.endsWith('}')) {
              testFixed += '}';
            }
            try {
              JSON.parse(testFixed);
              return testFixed;
            } catch {
              // Continue to next fix attempt
            }
          }
        }
        
        // Fix 2: Find and remove any property that matches the error pattern "english_3:""
        // This specifically targets the error message pattern
        const errorPattern = /,\s*"[^"]*:\s*""\s*/g;
        if (errorPattern.test(fixed)) {
          let testFixed = fixed.replace(errorPattern, '');
          // Ensure it ends with a closing brace
          if (testFixed.startsWith('{') && !testFixed.endsWith('}')) {
            testFixed = testFixed.replace(/,\s*$/, '') + '}';
          }
          try {
            JSON.parse(testFixed);
            return testFixed;
          } catch {
            // Continue to next fix attempt
          }
        }
        
        // Fix 3: Try to find the last valid property and remove everything after it
        // Look for the last complete property (has a value)
        const lastValidPropertyMatch = fixed.match(/("[^"]*"):\s*"[^"]*"\s*([,}])/);
        if (lastValidPropertyMatch && lastValidPropertyMatch.index !== undefined) {
          const lastValidIndex = lastValidPropertyMatch.index + lastValidPropertyMatch[0].length;
          if (lastValidIndex < fixed.length) {
            // Check if there's incomplete content after the last valid property
            const afterLastValid = fixed.substring(lastValidIndex).trim();
            if (afterLastValid && !afterLastValid.match(/^[,}]\s*$/)) {
              // Remove incomplete content and close properly
              let testFixed = fixed.substring(0, lastValidIndex);
              if (testFixed.endsWith(',')) {
                testFixed = testFixed.slice(0, -1);
              }
              if (!testFixed.endsWith('}')) {
                testFixed += '}';
              }
              try {
                JSON.parse(testFixed);
                return testFixed;
              } catch {
                // If that doesn't work, return null
              }
            }
          }
        }
        
        return null;
      }
    } catch {
      return null;
    }
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

          // Parse and validate timestamp to avoid NaN/invalid dates
          const rawTimestamp = parseInt(fields[1], 10);
          const timestamp = Number.isNaN(rawTimestamp) ? Date.now() : rawTimestamp;

          let result: TranslationResult | null = null;
          let grammarTeachingResult: GrammarTeachingResult | undefined = undefined;
          let responseSuggestionsResult: ResponseSuggestionsResult | undefined = undefined;
          
          if (type === 'grammar-teaching') {
            // For grammar-teaching, result is null and grammarTeachingResult is parsed
            if (grammarTeachingResultStr) {
              try {
                const grammarStr = grammarTeachingResultStr.trim();
                if (grammarStr && grammarStr.startsWith('{') && grammarStr.endsWith('}')) {
                  grammarTeachingResult = JSON.parse(grammarStr) as GrammarTeachingResult;
                } else {
                  console.warn('[DatabaseService] grammarTeachingResult field does not appear to be valid JSON:', grammarStr.substring(0, 100));
                  grammarTeachingResult = undefined;
                }
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.warn('[DatabaseService] Error parsing grammarTeachingResult JSON:', errorMessage);
                grammarTeachingResult = undefined;
              }
            }
          } else if (type === 'response-suggestions') {
            // For response-suggestions, result is null and responseSuggestionsResult is parsed
            if (responseSuggestionsResultStr) {
              try {
                const responseStr = responseSuggestionsResultStr.trim();
                if (responseStr && responseStr.startsWith('{') && responseStr.endsWith('}')) {
                  responseSuggestionsResult = JSON.parse(responseStr) as ResponseSuggestionsResult;
                } else {
                  console.warn('[DatabaseService] responseSuggestionsResult field does not appear to be valid JSON:', responseStr.substring(0, 100));
                  responseSuggestionsResult = undefined;
                }
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.warn('[DatabaseService] Error parsing responseSuggestionsResult JSON:', errorMessage);
                responseSuggestionsResult = undefined;
              }
            }
          } else {
            // For regular translations, parse result
            if (fields[5]) {
              try {
                // Validate that the field contains valid JSON before parsing
                let resultStr = fields[5].trim();
                
                // Remove surrounding quotes if present (from CSV escaping)
                if (resultStr.startsWith('"') && resultStr.endsWith('"')) {
                  resultStr = resultStr.slice(1, -1).replace(/""/g, '"');
                }
                
                // Check if it looks like JSON
                if (!resultStr || resultStr.length === 0) {
                  result = null;
                } else if (!resultStr.startsWith('{') || !resultStr.endsWith('}')) {
                  console.warn('[DatabaseService] Result field does not appear to be valid JSON (missing braces):', resultStr.substring(0, 100));
                  result = null;
                } else {
                  // Try to parse JSON
                  try {
                    result = JSON.parse(resultStr) as TranslationResult;
                  } catch (parseError) {
                    // Log the error for debugging
                    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                    console.warn('[DatabaseService] Initial JSON parse failed:', errorMessage);
                    console.warn('[DatabaseService] JSON string (first 300 chars):', resultStr.substring(0, 300));
                    console.warn('[DatabaseService] JSON string (last 100 chars):', resultStr.substring(Math.max(0, resultStr.length - 100)));
                    
                    // Try to fix common JSON issues
                    const fixedJson = this.tryFixJson(resultStr);
                    if (fixedJson) {
                      try {
                        result = JSON.parse(fixedJson) as TranslationResult;
                        console.log('[DatabaseService] Successfully fixed and parsed malformed JSON');
                      } catch (retryError) {
                        const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
                        console.warn('[DatabaseService] Error parsing result JSON even after fix attempt:', retryErrorMessage);
                        console.warn('[DatabaseService] Fixed JSON (first 300 chars):', fixedJson.substring(0, 300));
                        result = null;
                      }
                    } else {
                      console.warn('[DatabaseService] Could not fix malformed JSON, setting result to null');
                      result = null;
                    }
                  }
                }
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.warn('[DatabaseService] Unexpected error parsing result JSON, setting to null:', errorMessage);
                result = null;
              }
            }
          }
          
          entries.push({
            id: fields[0],
            timestamp,
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
