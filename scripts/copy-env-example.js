const { existsSync, copyFileSync, readdirSync, statSync } = require('fs');
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

if (!existsSync(envExamplePath)) {
  console.warn('[PostBuild] .env.example not found in project root:', envExamplePath);
  process.exit(0);
}

console.log('[PostBuild] Copying .env.example to output directories...');
console.log('[PostBuild] Found output directories:', outputDirs);

outputDirs.forEach((outputDir) => {
  const targetPath = join(process.cwd(), outputDir, '.env.example');
  try {
    copyFileSync(envExamplePath, targetPath);
    console.log('[PostBuild] Copied .env.example to:', targetPath);
    console.log('[PostBuild] Target file exists:', existsSync(targetPath));
  } catch (error) {
    console.error('[PostBuild] Error copying .env.example to', targetPath, ':', error);
  }
});

console.log('[PostBuild] Done copying .env.example files');

