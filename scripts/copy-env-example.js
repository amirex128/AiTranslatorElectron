const { existsSync, copyFileSync, readdirSync, statSync, mkdirSync } = require('fs');
const { join } = require('path');

// Find all output directories (out/aitranslatorelectron-*)
const outDir = join(process.cwd(), 'out');
const outputDirs = [];

if (existsSync(outDir)) {
  const entries = readdirSync(outDir);
  entries.forEach((entry) => {
    const fullPath = join(outDir, entry);
    if (statSync(fullPath).isDirectory() && entry.startsWith('aitranslatorelectron-')) {
      outputDirs.push(join('out', entry));
    }
  });
}

const envExamplePath = join(process.cwd(), '.env.example');
const assetsSourcePath = join(process.cwd(), 'src', 'assets');

console.log('[PostBuild] Copying files to output directories...');
console.log('[PostBuild] Found output directories:', outputDirs);

outputDirs.forEach((outputDir) => {
  const outputFullPath = join(process.cwd(), outputDir);
  
  // Copy .env.example
  if (existsSync(envExamplePath)) {
    const targetEnvPath = join(outputFullPath, '.env.example');
    try {
      copyFileSync(envExamplePath, targetEnvPath);
      console.log('[PostBuild] Copied .env.example to:', targetEnvPath);
    } catch (error) {
      console.error('[PostBuild] Error copying .env.example to', targetEnvPath, ':', error);
    }
  } else {
    console.warn('[PostBuild] .env.example not found in project root:', envExamplePath);
  }
  
  // Copy assets directory
  if (existsSync(assetsSourcePath)) {
    const targetAssetsPath = join(outputFullPath, 'assets');
    try {
      // Create assets directory if it doesn't exist
      if (!existsSync(targetAssetsPath)) {
        mkdirSync(targetAssetsPath, { recursive: true });
      }
      
      // Copy all files from src/assets to output/assets
      const assetsFiles = readdirSync(assetsSourcePath);
      assetsFiles.forEach((file) => {
        const sourceFile = join(assetsSourcePath, file);
        const targetFile = join(targetAssetsPath, file);
        const stat = statSync(sourceFile);
        
        if (stat.isFile()) {
          copyFileSync(sourceFile, targetFile);
          console.log('[PostBuild] Copied asset file:', file);
        } else if (stat.isDirectory()) {
          // Recursively copy directories (like fonts)
          const copyRecursive = (src, dest) => {
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
          console.log('[PostBuild] Copied asset directory:', file);
        }
      });
      console.log('[PostBuild] Copied assets to:', targetAssetsPath);
    } catch (error) {
      console.error('[PostBuild] Error copying assets to', targetAssetsPath, ':', error);
    }
  } else {
    console.warn('[PostBuild] Assets directory not found in project root:', assetsSourcePath);
  }
});

console.log('[PostBuild] Done copying files');

