// Container entrypoint: runs the API (migrate -> seed -> API) and `next start` on port 3000
// side by side. If either stops, the other is stopped and the container exits.
const { spawn } = require('node:child_process');
const path = require('node:path');

const children = [
  spawn(process.execPath, [path.join(__dirname, 'api', 'scripts', 'start-prod.cjs')], {
    stdio: 'inherit',
  }),
  spawn(
    process.execPath,
    [path.join(__dirname, 'web', 'node_modules', 'next', 'dist', 'bin', 'next'), 'start', '-p', '3000'],
    { cwd: path.join(__dirname, 'web'), stdio: 'inherit' },
  ),
];

let exiting = false;
for (const child of children) {
  child.on('exit', (code) => {
    if (exiting) return;
    exiting = true;
    for (const other of children) if (other !== child) other.kill('SIGTERM');
    process.exit(code ?? 1);
  });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => children.forEach((child) => child.kill(signal)));
}
