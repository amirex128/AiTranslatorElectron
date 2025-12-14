import { app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

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
    
    // Last fallback: try app path directly (though this won't work if in asar)
    if (!existsSync(assetsPath)) {
      assetsPath = join(appPath, 'src', 'assets');
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

