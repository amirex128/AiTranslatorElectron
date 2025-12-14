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
    // In production, .env should be in userData directory (writable location)
    // Or in the same directory as the executable
    try {
      const userDataPath = app.getPath('userData');
      const userDataEnvPath = join(userDataPath, '.env');
      
      // Also check executable directory
      const execPath = process.execPath;
      const execDir = require('path').dirname(execPath);
      const execEnvPath = join(execDir, '.env');
      
      // Prefer userData (always writable)
      if (existsSync(userDataEnvPath)) {
        console.log('[EnvPath] Using .env from userData:', userDataEnvPath);
        return userDataEnvPath;
      }
      
      // Fallback to executable directory
      if (existsSync(execEnvPath)) {
        console.log('[EnvPath] Using .env from executable directory:', execEnvPath);
        return execEnvPath;
      }
      
      // Default to userData (always writable)
      console.log('[EnvPath] Creating .env in userData:', userDataEnvPath);
      return userDataEnvPath;
    } catch (error) {
      // Fallback if app methods are not available
      const execPath = process.execPath;
      const execDir = require('path').dirname(execPath);
      return join(execDir, '.env');
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

