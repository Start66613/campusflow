import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout as delay } from 'node:timers/promises';
import { writeIphonePreviewQr } from './iphone-preview-qr.mjs';

const require = createRequire(import.meta.url);
const expoCli = require.resolve('expo/bin/cli');
const account = 'start66613';
const performanceMode = process.argv.includes('--perf');
const port = Number(process.env.CAMPUSFLOW_EXPO_PORT ?? (performanceMode ? 8082 : 8081));
const showPreview = () => {
  try {
    const preview = writeIphonePreviewQr(port);
    if (preview) console.log(`iPhone 测试地址：${preview.url}\n二维码图片：${preview.path}`);
  } catch { console.warn('二维码图片未能生成；Expo 服务仍可正常使用。'); }
};

function fail(message) {
  console.error(`\n无法启动 iPhone 测试：${message}`);
  process.exit(1);
}

const offline = process.env.EXPO_OFFLINE?.trim().toLowerCase();
if (offline && offline !== '0' && offline !== 'false') {
  fail('EXPO_OFFLINE 已开启。iPhone Expo Go 必须验证电脑和手机使用同一 Expo 账号，请关闭离线模式后重试。');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) fail('CAMPUSFLOW_EXPO_PORT 不是有效端口。');

const whoami = spawnSync(process.execPath, [expoCli, 'whoami'], {
  encoding: 'utf8',
  timeout: 20_000,
  windowsHide: true,
});
if (whoami.status !== 0) {
  fail('Expo CLI 无法验证登录。请检查网络，再运行 npx expo login --browser 登录 start66613。');
}
const signedInAs = whoami.stdout.trim().split(/\r?\n/).at(-1);
if (signedInAs !== account) {
  fail(`Expo CLI 当前是 ${signedInAs || '未登录'}，但 iPhone Expo Go 使用 ${account}。请运行 npx expo login --browser。`);
}
console.log(`Expo CLI 账号已验证：${account}`);

async function inspectManifest() {
  try {
    const response = await fetch(`http://127.0.0.1:${port}`, {
      headers: { Accept: 'application/expo+json', 'Expo-Platform': 'ios' },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { reachable: true, valid: false, status: response.status };
    const manifest = await response.json();
    const bundleUrl = manifest.launchAsset?.url ? new URL(manifest.launchAsset.url) : null;
    const matchesMode = performanceMode
      ? bundleUrl?.searchParams.get('dev') === 'false' && bundleUrl.searchParams.get('minify') === 'true'
      : bundleUrl !== null && bundleUrl.searchParams.get('dev') !== 'false';
    return {
      reachable: true,
      valid: manifest.extra?.expoClient?.owner === account && manifest.extra?.expoClient?.slug === 'campusflow' && matchesMode,
      status: response.status,
    };
  } catch {
    return { reachable: false, valid: false, status: 0 };
  }
}

const existing = await inspectManifest();
if (existing.valid) {
  console.log(`端口 ${port} 上已有账号匹配的 CampusFlow 服务，无需重复启动。`);
  showPreview();
  process.exit(0);
}
if (existing.reachable) fail(`端口 ${port} 已有服务，但 iOS 项目清单未通过账号检查（HTTP ${existing.status}）。请先关闭旧的 Expo 终端。`);

const server = spawn(process.execPath, [expoCli, 'start', '--go', '--lan', '--port', String(port), ...(performanceMode ? ['--no-dev', '--minify'] : [])], {
  stdio: 'inherit',
  windowsHide: true,
});
server.on('error', (error) => fail(`Expo 启动失败：${error.message}`));
server.on('exit', (code) => { process.exitCode = code ?? 1; });

let verified = false;
for (let attempt = 0; attempt < 30 && server.exitCode === null; attempt += 1) {
  await delay(2_000);
  const manifest = await inspectManifest();
  if (manifest.valid) {
    verified = true;
    console.log(`\n✓ iOS 项目清单已验证：CampusFlow / ${account}${performanceMode ? ' / 性能对比模式' : ''}。现在可以在 iPhone Expo Go 扫码。\n`);
    showPreview();
    break;
  }
}
if (!verified && server.exitCode === null) {
  console.error('\nExpo 已显示二维码，但 iOS 项目清单未通过账号检查；不要扫码。请检查网络或登录状态。');
  server.kill();
  process.exitCode = 1;
}
