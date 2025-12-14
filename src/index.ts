// Load environment variables first, before any other imports
import dotenv from 'dotenv';
import { join } from 'path';
import { existsSync, copyFileSync } from 'fs';

// Get .env file path and load it
// In development, this will find .env in project root
// In production, this will use userData or executable directory
// NOTE: This must run BEFORE importing APP_CONFIG, which reads from process.env
function loadEnvFile(): void {
  let envPath: string;
  
  try {
    // Check if app is available (might not be in early initialization)
    let appPath: string;
    let isPackaged = false;
    
    try {
      const { app } = require('electron');
      appPath = app.getAppPath();
      isPackaged = app.isPackaged || false;
    } catch (error) {
      // App not ready yet, use process.cwd() as fallback
      appPath = process.cwd();
      // Try to detect if packaged by checking for .asar in path
      isPackaged = process.execPath.includes('.asar') || process.execPath.includes('app.asar');
    }
    
    if (isPackaged) {
      // In production, check multiple locations
      // 1. Executable directory (most common for portable apps)
      const execPath = process.execPath;
      const execDir = require('path').dirname(execPath);
      const execEnvPath = join(execDir, '.env');
      
      // 2. UserData directory (writable location)
      let userDataEnvPath: string | null = null;
      try {
        const { app } = require('electron');
        const userDataPath = app.getPath('userData');
        userDataEnvPath = join(userDataPath, '.env');
      } catch (error) {
        // App not ready, skip userData
      }
      
      // Prefer executable directory (where user likely placed .env)
      if (existsSync(execEnvPath)) {
        envPath = execEnvPath;
        console.log('[Main] Loading .env from executable directory:', envPath);
      } else if (userDataEnvPath && existsSync(userDataEnvPath)) {
        envPath = userDataEnvPath;
        console.log('[Main] Loading .env from userData:', envPath);
      } else {
        // .env not found, try to create from .env.example
        // Try multiple locations for .env.example
        let envExamplePath: string | null = null;
        
        // 1. Try executable directory first
        const execEnvExamplePath = join(execDir, '.env.example');
        if (existsSync(execEnvExamplePath)) {
          envExamplePath = execEnvExamplePath;
        } else {
          // 2. Try app.asar.unpacked (where forge copies it)
          try {
            const { app } = require('electron');
            const appPath = app.getAppPath();
            const unpackedPath = appPath.replace('app.asar', 'app.asar.unpacked');
            const unpackedEnvExamplePath = join(unpackedPath, '.env.example');
            if (existsSync(unpackedEnvExamplePath)) {
              envExamplePath = unpackedEnvExamplePath;
            }
          } catch (error) {
            // App not ready, skip
          }
          
          // 3. Try resources directory
          if (!envExamplePath) {
            try {
              const { app } = require('electron');
              const appPath = app.getAppPath();
              const resourcesPath = join(appPath, '..', '..', 'resources');
              const resourcesEnvExamplePath = join(resourcesPath, 'app.asar.unpacked', '.env.example');
              if (existsSync(resourcesEnvExamplePath)) {
                envExamplePath = resourcesEnvExamplePath;
              }
            } catch (error) {
              // App not ready, skip
            }
          }
          
          // 4. Last resort: Try to run the copy script if .env.example exists in project root
          // This is a fallback in case postmake didn't run
          if (!envExamplePath) {
            try {
              // Try to find project root by going up from executable
              let searchDir = execDir;
              for (let i = 0; i < 10; i++) {
                const projectRootEnvExample = join(searchDir, '.env.example');
                if (existsSync(projectRootEnvExample)) {
                  // Found project root, copy to executable directory
                  console.log('[Main] Found .env.example in project root, copying to executable directory...');
                  copyFileSync(projectRootEnvExample, execEnvExamplePath);
                  envExamplePath = execEnvExamplePath;
                  break;
                }
                const parentDir = join(searchDir, '..');
                if (parentDir === searchDir) break; // Reached root
                searchDir = parentDir;
              }
            } catch (error) {
              // Ignore errors in fallback
            }
          }
        }
        
        if (envExamplePath) {
          console.log('[Main] .env not found, creating from .env.example...');
          console.log('[Main] Found .env.example at:', envExamplePath);
          console.log('[Main] Executable directory:', execDir);
          console.log('[Main] Target .env path:', execEnvPath);
          try {
            copyFileSync(envExamplePath, execEnvPath);
            console.log('[Main] Successfully created .env from .env.example at:', execEnvPath);
            console.log('[Main] Verifying .env file exists:', existsSync(execEnvPath));
            envPath = execEnvPath;
          } catch (error) {
            console.error('[Main] Error creating .env from .env.example:', error);
            // Fallback to executable directory anyway
            envPath = execEnvPath;
          }
        } else {
          // Default to executable directory (will create if needed)
          envPath = execEnvPath;
          console.log('[Main] .env not found, will use executable directory:', envPath);
          console.log('[Main] Executable directory:', execDir);
          console.log('[Main] Searched for .env.example in:');
          console.log('[Main]   -', join(execDir, '.env.example'));
          try {
            const { app } = require('electron');
            const appPath = app.getAppPath();
            console.log('[Main]   -', join(appPath.replace('app.asar', 'app.asar.unpacked'), '.env.example'));
            console.log('[Main]   -', join(appPath, '..', '..', 'resources', 'app.asar.unpacked', '.env.example'));
          } catch (error) {
            // App not ready, skip
          }
          console.log('[Main] Please create .env file or ensure .env.example exists in:', execDir);
        }
      }
    } else {
      // In development, .env is in project root
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
      
      envPath = join(projectRoot, '.env');
      console.log('[Main] Loading .env from project root:', envPath);
    }
    
    // Load .env file
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      console.warn('[Main] Warning: Could not load .env file:', result.error.message);
      console.warn('[Main] Tried path:', envPath);
      console.warn('[Main] File exists:', existsSync(envPath));
      
      // Fallback: try default dotenv.config() behavior (current directory)
      const fallbackResult = dotenv.config();
      if (fallbackResult.error) {
        console.error('[Main] Error: Could not load .env file even with fallback:', fallbackResult.error.message);
      } else {
        console.log('[Main] Loaded .env using fallback (current directory)');
      }
    } else {
      console.log('[Main] Successfully loaded .env file from:', envPath);
      // Log some key variables to verify (without exposing sensitive data)
      console.log('[Main] SELECTED_MODEL:', process.env.SELECTED_MODEL ? 'SET' : 'NOT SET');
    }
  } catch (error) {
    console.error('[Main] Error loading .env file:', error);
    // Last resort: try default dotenv.config()
    dotenv.config();
  }
}

// Load .env file BEFORE any other imports that depend on process.env
loadEnvFile();

import { app, Menu } from 'electron';
import { createWindow, showWindow } from './main/window';
import { createTray } from './main/tray';
import { registerShortcuts, unregisterShortcuts } from './main/shortcuts';
import { checkAIProviderConnection } from './main/healthCheck';
import { APP_CONFIG } from './constants/appConfig';
import { databaseService } from './main/database/DatabaseService';
import { AIServiceFactory } from './main/services/AIServiceFactory';
import { registerAllIPCHandlers, registerTranslationIPCHandlers } from './main/ipc/ipcRouter';
import { AppSettings } from './types/settings';

// Initialize AI service factory
const aiServiceFactory = new AIServiceFactory();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Register IPC handlers before app ready
registerAllIPCHandlers();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async () => {
  // Remove default menu bar
  Menu.setApplicationMenu(null);
  
  // Initialize AI services with settings from APP_CONFIG
  const settings = APP_CONFIG as AppSettings;
  const aiService = aiServiceFactory.createService(settings);
  
  // Register translation handlers now that service is available
  registerTranslationIPCHandlers(aiService);
  
  await createWindow();
  createTray();
  
  // Get mainWindow after it's created
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const windowModule = require('./main/window');
  if (windowModule.mainWindow) {
    registerShortcuts(windowModule.mainWindow, APP_CONFIG.shortcuts);
  }

  // Health check on startup
  const isConnected = await checkAIProviderConnection(settings.aiProviderUrl);
  if (!isConnected) {
    console.warn('AI Provider is not available at', settings.aiProviderUrl);
  }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Don't quit, keep running in tray
  }
});

app.on('activate', () => {
  showWindow();
});

app.on('will-quit', async (event) => {
  console.log('[App] will-quit event triggered');
  unregisterShortcuts();
  try {
    await databaseService.close();
  } catch (error) {
    console.error('[App] Error closing database:', error);
  }
});

// Handle before-quit to ensure cleanup
app.on('before-quit', async (event) => {
  console.log('[App] before-quit event triggered');
  // Don't prevent default, allow quit to proceed
});
