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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/utils/assetsPath.ts:getAssetsPath',message:'Strategy 1: Checking unpackedPath',data:{path:assetsPath,exists:existsSync(assetsPath),appPath,unpackedPath},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Strategy 2: Try process.execPath directory (executable location)
    // This works for portable apps or when app is in a specific directory
    if (!existsSync(assetsPath)) {
      const execDir = require('path').dirname(process.execPath);
      assetsPath = join(execDir, 'resources', 'app.asar.unpacked', 'src', 'assets');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/utils/assetsPath.ts:getAssetsPath',message:'Strategy 2: Checking execDir resources',data:{path:assetsPath,exists:existsSync(assetsPath),execDir},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    }
    
    // Strategy 3: Try resources/app.asar.unpacked relative to appPath
    if (!existsSync(assetsPath)) {
      const resourcesPath = join(appPath, '..', '..', 'resources');
      assetsPath = join(resourcesPath, 'app.asar.unpacked', 'src', 'assets');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/utils/assetsPath.ts:getAssetsPath',message:'Strategy 3: Checking resourcesPath',data:{path:assetsPath,exists:existsSync(assetsPath),resourcesPath},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    
    // Strategy 6: Try reading from asar archive directly (if assets weren't unpacked)
    // In Electron, we can read from asar using the app.asar path
    if (!existsSync(assetsPath)) {
      // Try app.asar/src/assets (inside the asar archive)
      const asarAssetsPath = join(appPath, 'src', 'assets');
      // Note: existsSync might not work for files inside asar, but we can try to read them
      // For now, we'll use this as a fallback
      assetsPath = asarAssetsPath;
    }
    
    // Strategy 7: Try executable directory (where postmake script copies assets)
    if (!existsSync(assetsPath)) {
      const execDir = require('path').dirname(process.execPath);
      const execAssetsPath = join(execDir, 'assets');
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/main/utils/assetsPath.ts:getAssetsPath',message:'Strategy 7: Checking execDir assets',data:{path:execAssetsPath,exists:existsSync(execAssetsPath),execDir},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (existsSync(execAssetsPath)) {
        assetsPath = execAssetsPath;
      }
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

