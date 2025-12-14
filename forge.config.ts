import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
// Temporarily disabled to fix build issues
// import { MakerDeb } from '@electron-forge/maker-deb';
// import { MakerRpm } from '@electron-forge/maker-rpm';
// import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
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
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'afterExtract hook called',data:{buildPath,envExamplePath,envExampleExists:existsSync(envExamplePath),cwd:process.cwd()},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          // buildPath is typically: out/aitranslatorelectron-win32-x64/resources/app.asar.unpacked
          // We want to copy .env and .env.example to the executable directory (where .exe is)
          // Executable directory is: buildPath/../../ (two levels up from app.asar.unpacked)
          const executableDir = join(buildPath, '..', '..');
          const targetEnvPath = join(executableDir, '.env');
          const targetEnvExamplePath = join(executableDir, '.env.example');
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'Calculated paths',data:{executableDir,targetEnvExamplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'Before copyFileSync .env.example',data:{source:envExamplePath,target:targetEnvExamplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            copyFileSync(envExamplePath, targetEnvExamplePath);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'After copyFileSync .env.example',data:{targetExists:existsSync(targetEnvExamplePath)},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.log('[Forge] Successfully copied .env.example file');
          } else {
            console.warn('[Forge] Warning: .env.example file not found in project root.');
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'.env.example not found',data:{envExamplePath,checkedPath:envExamplePath},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
          }
          
          // Call callback to continue build
          callback();
        } catch (error) {
          console.error('[Forge] Error in afterExtract hook:', error);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/8f3b4518-966f-45c8-9d5c-af7cc357afc0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'forge.config.ts:afterExtract',message:'Error in afterExtract',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'build',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
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
      setupIcon: undefined, // Add icon path if you have one
      // Configure for Windows EXE installer
      authors: 'amir.shirdeli',
      description: 'AI Translator Electron Application',
    }, ['win32']),
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
