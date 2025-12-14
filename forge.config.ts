import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: {
      // Unpack assets folder for CSV files
      unpack: 'src/assets/**',
    },
    // Ensure assets folder is included in the package
    extraResource: [],
    // Hook to copy .env file to output directory after extract
    afterExtract: [
      async (buildPath, electronVersion, platform, arch) => {
        const envPath = join(process.cwd(), '.env');
        const targetEnvPath = join(buildPath, '.env');
        
        if (existsSync(envPath)) {
          console.log('[Forge] Copying .env file to build directory:', targetEnvPath);
          try {
            copyFileSync(envPath, targetEnvPath);
            console.log('[Forge] Successfully copied .env file');
          } catch (error) {
            console.error('[Forge] Error copying .env file:', error);
          }
        } else {
          console.warn('[Forge] Warning: .env file not found in project root.');
          console.warn('[Forge] The application will look for .env in the executable directory at runtime.');
          console.warn('[Forge] Please ensure .env file exists in the same directory as the executable.');
        }
      },
    ],
  },
  makers: [
    new MakerSquirrel({
      name: 'aitranslatorelectron',
      setupIcon: undefined, // Add icon path if you have one
      // Configure for Windows EXE installer
      authors: 'amir.shirdeli',
      description: 'AI Translator Electron Application',
    }),
    // Add ZIP maker for all platforms to create release artifacts
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-electronegativity',
      config: {
        isSarif: true
      }
    },
    new AutoUnpackNativesPlugin({}),
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
