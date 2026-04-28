const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

const excludedDirectories = new Set([
  '.git',
  'content',
  'dist',
  'functions',
  'netlify',
  'node_modules',
  'scripts'
]);

const excludedRootFiles = new Set([
  '.env',
  '.env.example',
  '.gitignore',
  'BLOG_ADMIN_README.md',
  'CLOUDFLARE_SVELTIA_CMS_SETUP.md',
  'package-lock.json',
  'package.json',
  'wrangler.toml'
]);

function assertSafeDistPath() {
  const resolvedDist = path.resolve(dist);
  if (!resolvedDist.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to clean unsafe output path: ${resolvedDist}`);
  }
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function copyPublicOutput() {
  assertSafeDistPath();
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const sourcePath = path.join(root, entry.name);
    const targetPath = path.join(dist, entry.name);

    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) {
        copyDirectory(sourcePath, targetPath);
      }
      continue;
    }

    if (entry.isFile() && !excludedRootFiles.has(entry.name)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

copyPublicOutput();
console.log(`Cloudflare Pages output prepared at ${dist}`);
