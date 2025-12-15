import { app } from 'electron';
import { join } from 'path';
import { existsSync, copyFileSync, readdirSync, statSync, mkdirSync } from 'fs';

/**
 * Get the path to the assets directory
 * Works in both development and production builds
 */
export function getAssetsPath(): string {
  const isDev = !app.isPackaged;
  
  if (isDev) {
    // In development, use src/assets directly from project root
    const appPath = app.getAppPath();
    let projectRoot = appPath;
    
    // If we're in .webpack/main, go up 3 levels
    if (appPath.includes('.webpack')) {
      projectRoot = join(appPath, '..', '..', '..');
    } else if (appPath.includes('src')) {
      // If we're in src/, go up 1 level
      projectRoot = join(appPath, '..');
    } else {
      // Try to find project root by looking for package.json
      let currentPath = appPath;
      for (let i = 0; i < 5; i++) {
        if (existsSync(join(currentPath, 'package.json'))) {
          projectRoot = currentPath;
          break;
        }
        currentPath = join(currentPath, '..');
      }
    }
    
    return join(projectRoot, 'src', 'assets');
  } else {
    // In production, assets are unpacked from asar
    // When files are unpacked, they go to app.asar.unpacked directory
    const appPath = app.getAppPath();
    
    // Strategy 1: Try app.asar.unpacked first (where unpacked files go)
    // This is the most common location for unpacked files
    const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
    let assetsPath = join(unpackedPath, 'src', 'assets');
    
    // If unpacked path doesn't exist, try to verify if it's actually unpacked
    // Sometimes existsSync returns false even if files are unpacked
    // So we'll try to use it anyway if no other path works
    
    // Strategy 2: Try process.execPath directory (executable location)
    // This works for portable apps or when app is in a specific directory
    if (!existsSync(assetsPath)) {
      const execDir = require('path').dirname(process.execPath);
      assetsPath = join(execDir, 'resources', 'app.asar.unpacked', 'src', 'assets');
    }
    
    // Strategy 3: Try resources/app.asar.unpacked relative to appPath
    if (!existsSync(assetsPath)) {
      const resourcesPath = join(appPath, '..', '..', 'resources');
      assetsPath = join(resourcesPath, 'app.asar.unpacked', 'src', 'assets');
    }
    
    // Strategy 4: Try process.resourcesPath (if available)
    if (!existsSync(assetsPath) && process.resourcesPath) {
      assetsPath = join(process.resourcesPath, 'app.asar.unpacked', 'src', 'assets');
    }
    
    // Strategy 5: Try __dirname (current module location)
    // This might work if the module is in the unpacked directory
    if (!existsSync(assetsPath)) {
      try {
        // __dirname might be in .webpack/main or similar, go up to find assets
        const currentDir = __dirname;
        if (currentDir.includes('app.asar.unpacked')) {
          // We're in unpacked, find assets relative to here
          let searchDir = currentDir;
          for (let i = 0; i < 5; i++) {
            const testPath = join(searchDir, 'src', 'assets');
            if (existsSync(testPath)) {
              assetsPath = testPath;
              break;
            }
            searchDir = join(searchDir, '..');
          }
        }
      } catch (error) {
        // __dirname might not be available in all contexts
        console.warn('[AssetsPath] Could not use __dirname:', error);
      }
    }
    
    // Strategy 6: Try executable directory (where postmake script copies assets)
    // This should be checked BEFORE trying asar archive
    let foundAssets = false;
    if (!existsSync(assetsPath)) {
      const execDir = require('path').dirname(process.execPath);
      const execAssetsPath = join(execDir, 'assets');
      if (existsSync(execAssetsPath)) {
        assetsPath = execAssetsPath;
        foundAssets = true;
      }
    }
    
    // Strategy 7: Try executable directory even if existsSync returns false
    // postmake script copies assets to executable directory, but existsSync might not work
    // We'll try to use it anyway as a fallback
    if (!foundAssets) {
      const execDir = require('path').dirname(process.execPath);
      const execAssetsPath = join(execDir, 'assets');
      
      // If assets don't exist in executable directory, try to copy from project root
      if (!existsSync(execAssetsPath)) {
        // Try to find project root by going up from executable
        let searchDir = execDir;
        let projectAssetsPath: string | null = null;
        
        for (let i = 0; i < 10; i++) {
          const testPath = join(searchDir, 'src', 'assets');
          if (existsSync(testPath)) {
            projectAssetsPath = testPath;
            break;
          }
          const parentDir = join(searchDir, '..');
          if (parentDir === searchDir) break; // Reached root
          searchDir = parentDir;
        }
        
        // If found project root, copy assets to executable directory
        if (projectAssetsPath) {
          try {
            console.log('[AssetsPath] Assets not found in executable directory, copying from project root...');
            // Create assets directory
            if (!existsSync(execAssetsPath)) {
              mkdirSync(execAssetsPath, { recursive: true });
            }
            
            // Copy all files from project assets to executable assets
            const assetsFiles = readdirSync(projectAssetsPath);
            assetsFiles.forEach((file) => {
              const sourceFile = join(projectAssetsPath!, file);
              const targetFile = join(execAssetsPath, file);
              const stat = statSync(sourceFile);
              
              if (stat.isFile()) {
                copyFileSync(sourceFile, targetFile);
                console.log('[AssetsPath] Copied asset file:', file);
              } else if (stat.isDirectory()) {
                // Recursively copy directories
                const copyRecursive = (src: string, dest: string) => {
                  if (!existsSync(dest)) {
                    mkdirSync(dest, { recursive: true });
                  }
                  const entries = readdirSync(src);
                  entries.forEach((entry) => {
                    const srcPath = join(src, entry);
                    const destPath = join(dest, entry);
                    const entryStat = statSync(srcPath);
                    if (entryStat.isFile()) {
                      copyFileSync(srcPath, destPath);
                    } else if (entryStat.isDirectory()) {
                      copyRecursive(srcPath, destPath);
                    }
                  });
                };
                copyRecursive(sourceFile, targetFile);
                console.log('[AssetsPath] Copied asset directory:', file);
              }
            });
            console.log('[AssetsPath] Successfully copied assets to:', execAssetsPath);
          } catch (error) {
            console.error('[AssetsPath] Error copying assets from project root:', error);
          }
        }
      }
      
      // Use executable directory even if existsSync returns false
      // (postmake might have copied assets but existsSync might not detect them)
      assetsPath = execAssetsPath;
      foundAssets = true; // Mark as found so we try this path
    }
    
    // Strategy 8: Fallback to unpacked path even if existsSync returns false
    // Sometimes existsSync returns false even if files are actually unpacked
    // We'll use the unpacked path as a fallback before trying asar
    if (!foundAssets && unpackedPath !== appPath) {
      const unpackedAssetsPath = join(unpackedPath, 'src', 'assets');
      assetsPath = unpackedAssetsPath;
      foundAssets = true; // Mark as found so Strategy 9 doesn't override it
    }
    
    // Strategy 9: Try reading from asar archive directly (ONLY if nothing else worked)
    // In Electron, we can read from asar using the app.asar path
    // Note: existsSync might not work for files inside asar, but we can try to read them
    if (!foundAssets) {
      // Try app.asar/src/assets (inside the asar archive)
      const asarAssetsPath = join(appPath, 'src', 'assets');
      // Use asar path as last fallback even if existsSync returns false
      // (because existsSync doesn't work for files inside asar)
      assetsPath = asarAssetsPath;
    }
    
    console.log('[AssetsPath] Final assets path:', assetsPath);
    console.log('[AssetsPath] Assets path exists:', existsSync(assetsPath));
    
    return assetsPath;
  }
}

/**
 * Get the path to a specific asset file
 */
export function getAssetPath(filename: string): string {
  return join(getAssetsPath(), filename);
}

