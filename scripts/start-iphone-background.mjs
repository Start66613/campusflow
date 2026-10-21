import { spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.CAMPUSFLOW_EXPO_PORT ?? 8081);
if (process.platform !== 'win32') throw new Error('This background launcher is for Windows. Use npm run start:iphone on other platforms.');
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid CAMPUSFLOW_EXPO_PORT.');
const log = join(root, '.expo', 'iphone-server.log');
const errorLog = join(root, '.expo', 'iphone-server-error.log');

async function ready() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}`, {
      headers: { Accept: 'application/expo+json', 'Expo-Platform': 'ios' },
      signal: AbortSignal.timeout(3000),
    });
    const manifest = await response.json();
    return response.ok && manifest.extra?.expoClient?.owner === 'start66613'
      && manifest.extra?.expoClient?.slug === 'campusflow' && Boolean(manifest.launchAsset?.url);
  } catch { return false; }
}

function refreshPreview() {
  const result = spawnSync(process.execPath, ['scripts/start-iphone.mjs'], { cwd: root, stdio: 'inherit', windowsHide: true });
  process.exit(result.status ?? 1);
}

if (await ready()) refreshPreview();
const occupied = await new Promise((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port });
  socket.setTimeout(1000);
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('error', () => { socket.destroy(); resolve(false); });
  socket.once('timeout', () => { socket.destroy(); resolve(true); });
});
if (occupied) throw new Error(`Port ${port} has another or unhealthy service. No existing processes were stopped.`);

mkdirSync(join(root, '.expo'), { recursive: true });
const quote = (value) => `'${value.replaceAll("'", "''")}'`;
// Use an ordinary inline command, not a .ps1 file: restricted script policies
// remain untouched. A hidden independent process outlives this agent terminal.
const command = `$previewProcess = Start-Process -FilePath ${quote(process.execPath)} -ArgumentList @('scripts/start-iphone.mjs') -WorkingDirectory ${quote(root)} -WindowStyle Hidden -RedirectStandardOutput ${quote(log)} -RedirectStandardError ${quote(errorLog)} -PassThru; Write-Output $previewProcess.Id`;
const started = spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command], { encoding: 'utf8', windowsHide: true, timeout: 10_000 });
if (started.error || started.status !== 0) throw new Error(started.error?.message ?? started.stderr.trim() ?? 'Could not start Expo.');
console.log(`Expo background process: ${started.stdout.trim()}\nLogs: ${log}\nErrors: ${errorLog}`);
for (let attempt = 0; attempt < 40; attempt++) {
  if (await ready()) refreshPreview();
  await delay(1000);
}
throw new Error(`Expo did not become ready. Read ${log} and ${errorLog}; do not use an old QR.`);
