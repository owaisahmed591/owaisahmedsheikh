const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit'
  });
  if (result.status !== 0) {
    const reason = result.error ? `: ${result.error.message}` : '';
    throw new Error(`${command} ${args.join(' ')} failed${reason}`);
  }
}

function npmCli() {
  return process.platform === 'win32'
    ? path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : path.join(path.dirname(process.execPath), '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');
}

function wranglerCli() {
  return path.join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
}

function main() {
  const tempOut = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-functions-'));

  try {
    run(process.execPath, ['--check', 'scripts/static-server.js']);
    run(process.execPath, ['--check', 'admin/studio.js']);
    run(process.execPath, ['--check', 'scripts/build-blog.js']);
    run(process.execPath, [npmCli(), 'run', 'audit:content']);
    run(process.execPath, [npmCli(), 'run', 'audit:cms']);
    run(process.execPath, [npmCli(), 'audit', '--audit-level=moderate']);
    run(process.execPath, [npmCli(), 'run', 'build:cloudflare']);
    run(process.execPath, [
      wranglerCli(),
      'pages',
      'functions',
      'build',
      'functions',
      '--outdir',
      tempOut,
      '--compatibility-date',
      '2026-04-28'
    ]);
  } finally {
    fs.rmSync(tempOut, { recursive: true, force: true });
  }

  console.log('Deploy readiness checks passed.');
}

main();
