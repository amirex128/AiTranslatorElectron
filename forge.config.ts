import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
// import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

// Get icon path (same as used in tray and window)
const getIconPath = (): string => {
  // In forge config, we're in the project root
  const iconPath = join(process.cwd(), 'src', 'assets', 'images.png');
  if (existsSync(iconPath)) {
    return iconPath;
  }
  // Fallback: try __dirname
  const fallbackPath = join(__dirname, 'src', 'assets', 'images.png');
  return existsSync(fallbackPath) ? fallbackPath : iconPath;
};

// Get ICO icon path for Windows installer (MakerSquirrel requires .ico file)
const getIcoIconPath = (): string | undefined => {
  // Try to find .ico file
  const icoPath = join(process.cwd(), 'src', 'assets', 'images.ico');
  if (existsSync(icoPath)) {
    return icoPath;
  }
  // Fallback: try __dirname
  const fallbackPath = join(__dirname, 'src', 'assets', 'images.ico');
  if (existsSync(fallbackPath)) {
    return fallbackPath;
  }
  // If no .ico file exists, return undefined (MakerSquirrel will use default)
  return undefined;
};

const config: ForgeConfig = {
  packagerConfig: {
    icon: getIconPath(), // Set icon for the packaged app (same as tray and window)
    asar: {
      // Unpack assets folder for CSV files and images
      // Pattern matches files in assets directory
      unpack: '**/assets/**',
    },
    // Hook to copy .env and .env.example files to output directory after extract
    afterExtract: [
      (buildPath, electronVersion, platform, arch, callback) => {
        // Use callback-based approach instead of async/await for better compatibility
        try {
          const envPath = join(process.cwd(), '.env');
          const envExamplePath = join(process.cwd(), '.env.example');
          
          // buildPath is typically: out/aitranslatorelectron-win32-x64/resources/app.asar.unpacked
          // We want to copy .env and .env.example to the executable directory (where .exe is)
          // Executable directory is: buildPath/../../ (two levels up from app.asar.unpacked)
          const executableDir = join(buildPath, '..', '..');
          const targetEnvPath = join(executableDir, '.env');
          const targetEnvExamplePath = join(executableDir, '.env.example');
          
          // Ensure directory exists
          if (!existsSync(executableDir)) {
            mkdirSync(executableDir, { recursive: true });
          }
          
          // Copy .env if it exists
          if (existsSync(envPath)) {
            console.log('[Forge] Copying .env file to executable directory:', targetEnvPath);
            copyFileSync(envPath, targetEnvPath);
            console.log('[Forge] Successfully copied .env file');
          } else {
            console.warn('[Forge] Warning: .env file not found in project root.');
            console.warn('[Forge] The application will create .env from .env.example on first run if needed.');
          }
          
          // Always copy .env.example so it can be used as fallback
          if (existsSync(envExamplePath)) {
            console.log('[Forge] Copying .env.example file to executable directory:', targetEnvExamplePath);
            copyFileSync(envExamplePath, targetEnvExamplePath);
            console.log('[Forge] Successfully copied .env.example file');
          } else {
            console.warn('[Forge] Warning: .env.example file not found in project root.');
          }
          
          // Call callback to continue build
          callback();
        } catch (error) {
          console.error('[Forge] Error in afterExtract hook:', error);
          // Call callback even on error to continue build
          callback();
        }
      },
    ],
  },
  makers: [
    // Windows makers
    new MakerSquirrel({
      name: 'aitranslatorelectron',
      setupIcon: getIcoIconPath(), // Use .ico file if available (MakerSquirrel requires .ico, not .png)
      // Configure for Windows EXE installer
      authors: 'amir.shirdeli',
      description: 'AI Translator Electron Application',
    }, ['win32']),
    // Linux makers
    new MakerDeb({
      options: {
        name: 'aitranslatorelectron',
        productName: 'AI Translator',
        genericName: 'AI Translator',
        description: 'AI Translator Electron Application',
        categories: ['Utility', 'Education'],
        maintainer: 'amir.shirdeli',
        icon: getIconPath(), // Use PNG icon for Linux
      },
    }, ['linux']),
    new MakerRpm({
      options: {
        name: 'aitranslatorelectron',
        productName: 'AI Translator',
        genericName: 'AI Translator',
        description: 'AI Translator Electron Application',
        categories: ['Utility', 'Education'],
        maintainer: 'amir.shirdeli',
        icon: getIconPath(), // Use PNG icon for Linux
      },
    }, ['linux']),
    // ZIP maker for all platforms
    new MakerZIP({}, ['win32', 'darwin', 'linux']),
  ],
  plugins: [
    // Temporarily disabled AutoUnpackNativesPlugin to fix EPERM issues on Windows
    // new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
