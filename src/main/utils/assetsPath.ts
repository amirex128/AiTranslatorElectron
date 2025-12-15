import { app } from 'electron';
import { join } from 'path';
import { existsSync, copyFileSync, readdirSync, statSync, mkdirSync } from 'fs';

/**
 * Get the path to the assets directory
 * Works in both development and production builds
 * Cross-platform compatible (Windows, Linux, macOS)
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
    
    const devAssetsPath = join(projectRoot, 'src', 'assets');
    console.log('[AssetsPath] Development assets path:', devAssetsPath);
    return devAssetsPath;
  } else {
    // In production, try multiple strategies in order of preference
    // Strategy 1: Try app.asar.unpacked (where unpacked files go)
    const appPath = app.getAppPath();
    const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
    let assetsPath = join(unpackedPath, 'src', 'assets');
    
    if (existsSync(assetsPath)) {
      console.log('[AssetsPath] Using unpacked assets path:', assetsPath);
      return assetsPath;
    }
    
    // Strategy 2: Try executable directory (where postmake script copies assets)
    try {
      const execDir = require('path').dirname(process.execPath);
      const execAssetsPath = join(execDir, 'assets');
      if (existsSync(execAssetsPath)) {
        console.log('[AssetsPath] Using executable directory assets:', execAssetsPath);
        return execAssetsPath;
      }
    } catch (error) {
      console.warn('[AssetsPath] Error checking executable directory:', error);
    }
    
    // Strategy 3: Try resources/app.asar.unpacked
    try {
      const resourcesPath = join(appPath, '..', '..', 'resources');
      const resourcesAssetsPath = join(resourcesPath, 'app.asar.unpacked', 'src', 'assets');
      if (existsSync(resourcesAssetsPath)) {
        console.log('[AssetsPath] Using resources unpacked assets:', resourcesAssetsPath);
        return resourcesAssetsPath;
      }
    } catch (error) {
      console.warn('[AssetsPath] Error checking resources path:', error);
    }
    
    // Strategy 4: Use userData as fallback (always writable, cross-platform)
    // This ensures CSV files are always accessible and writable
    try {
      const userDataPath = app.getPath('userData');
      const userDataAssetsPath = join(userDataPath, 'assets');
      
      // Create directory if it doesn't exist
      if (!existsSync(userDataAssetsPath)) {
        mkdirSync(userDataAssetsPath, { recursive: true });
        console.log('[AssetsPath] Created userData assets directory:', userDataAssetsPath);
      }
      
      console.log('[AssetsPath] Using userData assets path (fallback):', userDataAssetsPath);
      return userDataAssetsPath;
    } catch (error) {
      console.error('[AssetsPath] Error using userData fallback:', error);
      // Last resort: use unpacked path even if existsSync returns false
      console.log('[AssetsPath] Using unpacked path as last resort:', assetsPath);
      return assetsPath;
    }
  }
}

/**
 * Get the path to a specific asset file
 */
export function getAssetPath(filename: string): string {
  return join(getAssetsPath(), filename);
}

