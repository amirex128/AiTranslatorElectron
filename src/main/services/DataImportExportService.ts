import { join } from 'path';
import { existsSync, promises as fs, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import AdmZip from 'adm-zip';
import { getAssetsPath } from '../utils/assetsPath';

const REQUIRED_FILES = ['bookmarks.csv', 'history.csv', 'quick-translate-cache.csv'];

export class DataImportExportService {
  private assetsPath: string;

  constructor() {
    this.assetsPath = getAssetsPath();
  }

  /**
   * Export all three CSV files to a ZIP file
   * @param zipFilePath - Path where the ZIP file should be saved
   * @returns Promise that resolves when export is complete
   */
  async exportData(zipFilePath: string): Promise<void> {
    const zip = new AdmZip();

    // Check if files exist and add them to ZIP
    for (const filename of REQUIRED_FILES) {
      const filePath = join(this.assetsPath, filename);
      
      if (existsSync(filePath)) {
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          zip.addFile(filename, Buffer.from(fileContent, 'utf-8'));
          console.log(`[DataImportExport] Added ${filename} to ZIP`);
        } catch (error) {
          console.error(`[DataImportExport] Error reading ${filename}:`, error);
          throw new Error(`Failed to read ${filename}: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.warn(`[DataImportExport] File ${filename} does not exist, skipping`);
        // Create empty file in ZIP if it doesn't exist
        zip.addFile(filename, Buffer.from('', 'utf-8'));
      }
    }

    // Write ZIP file
    try {
      zip.writeZip(zipFilePath);
      console.log(`[DataImportExport] Successfully exported data to ${zipFilePath}`);
    } catch (error) {
      console.error('[DataImportExport] Error writing ZIP file:', error);
      throw new Error(`Failed to write ZIP file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import data from a ZIP file
   * @param zipFilePath - Path to the ZIP file to import
   * @returns Promise that resolves when import is complete
   */
  async importData(zipFilePath: string): Promise<void> {
    // Validate ZIP file exists
    if (!existsSync(zipFilePath)) {
      throw new Error('ZIP file does not exist');
    }

    // Create temporary directory for extraction
    const tempDir = mkdtempSync(join(tmpdir(), 'ai-translator-import-'));
    
    try {
      // Extract ZIP file
      const zip = new AdmZip(zipFilePath);
      zip.extractAllTo(tempDir, true);
      console.log(`[DataImportExport] Extracted ZIP to ${tempDir}`);

      // Validate that all required files exist in the extracted ZIP
      const missingFiles: string[] = [];
      for (const filename of REQUIRED_FILES) {
        const extractedPath = join(tempDir, filename);
        if (!existsSync(extractedPath)) {
          missingFiles.push(filename);
        }
      }

      if (missingFiles.length > 0) {
        throw new Error(`Missing required files in ZIP: ${missingFiles.join(', ')}`);
      }

      // Replace existing files with imported files
      for (const filename of REQUIRED_FILES) {
        const extractedPath = join(tempDir, filename);
        const targetPath = join(this.assetsPath, filename);
        
        try {
          // Read the imported file
          const fileContent = await fs.readFile(extractedPath, 'utf-8');
          
          // Write to target location
          await fs.writeFile(targetPath, fileContent, 'utf-8');
          console.log(`[DataImportExport] Successfully imported ${filename}`);
        } catch (error) {
          console.error(`[DataImportExport] Error importing ${filename}:`, error);
          throw new Error(`Failed to import ${filename}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      console.log('[DataImportExport] Successfully imported all data');
    } finally {
      // Clean up temporary directory
      try {
        rmSync(tempDir, { recursive: true, force: true });
        console.log(`[DataImportExport] Cleaned up temporary directory ${tempDir}`);
      } catch (error) {
        console.warn(`[DataImportExport] Failed to clean up temporary directory:`, error);
      }
    }
  }
}

export const dataImportExportService = new DataImportExportService();

