import { app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Get .env file path
 * This function can be called after app is ready, or in development mode
 */
export function getEnvFilePath(): string {
  // In development, app might not be ready yet, so we need a fallback
  let appPath: string;
  
  try {
    appPath = app.getAppPath();
  } catch (error) {
    // App not ready yet, use process.cwd() as fallback
    appPath = process.cwd();
  }
  
  const isPackaged = app.isPackaged || false;
  
  if (isPackaged) {
    // In production, .env should be in the same directory as the executable
    // This is the most common location for portable apps
    const execPath = process.execPath;
    const execDir = require('path').dirname(execPath);
    const execEnvPath = join(execDir, '.env');
    
    // First, check executable directory (most common for portable apps)
    if (existsSync(execEnvPath)) {
      console.log('[EnvPath] Using .env from executable directory:', execEnvPath);
      return execEnvPath;
    }
    
    // Fallback to userData directory (writable location)
    try {
      const userDataPath = app.getPath('userData');
      const userDataEnvPath = join(userDataPath, '.env');
      
      if (existsSync(userDataEnvPath)) {
        console.log('[EnvPath] Using .env from userData:', userDataEnvPath);
        return userDataEnvPath;
      }
      
      // Default to executable directory (where user should place .env)
      console.log('[EnvPath] .env not found, will use executable directory:', execEnvPath);
      console.log('[EnvPath] Please place .env file in:', execDir);
      return execEnvPath;
    } catch (error) {
      // Fallback if app methods are not available
      console.log('[EnvPath] App not ready, using executable directory:', execEnvPath);
      return execEnvPath;
    }
  } else {
    // In development, .env is in project root
    // app.getAppPath() returns path to src/ or .webpack/ in dev
    // We need to go up to project root
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
    
    const envPath = join(projectRoot, '.env');
    console.log('[EnvPath] Development .env path:', envPath);
    return envPath;
  }
}

