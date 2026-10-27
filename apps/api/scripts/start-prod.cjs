// Production start sequence: prisma migrate deploy -> demo seed -> API.
const { spawnSync, spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const apiDirectory = path.resolve(__dirname, '..');
const distDirectory = path.join(apiDirectory, 'dist');

function findDistFile(relative) {
  const found = [relative, path.join('src', relative)].find((candidate) =>
    existsSync(path.join(distDirectory, candidate)),
  );
  if (!found) throw new Error(`dist/${relative} not found. Run "pnpm --filter api build" first.`);
  return path.join(distDirectory, found);
}

function runNode(args) {
  return spawnSync(process.execPath, args, { cwd: apiDirectory, stdio: 'inherit' });
}

const prismaCli = require.resolve('prisma/build/index.js', { paths: [apiDirectory] });
const migrate = runNode([prismaCli, 'migrate', 'deploy']);
if (migrate.status !== 0) {
  console.error('[start] prisma migrate deploy failed; not starting the API.');
  process.exit(migrate.status ?? 1);
}

// A seed failure is logged by the seed script and does not block startup.
const seed = runNode([findDistFile(path.join('demo', 'seed-demo.js'))]);
if (seed.status !== 0) {
  console.error('[start] demo seed failed; continuing to start the API.');
}

const api = spawn(process.execPath, [findDistFile('main.js')], {
  cwd: apiDirectory,
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => api.kill(signal));
}
api.on('exit', (code) => process.exit(code ?? 1));
