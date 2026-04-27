#!/usr/bin/env node

/**
 * postinstall 脚本：根据当前平台下载对应的 aria2c 二进制
 * 下载到 resources/aria2/ 目录
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARIA2_VERSION = '1.37.0';
const TARGET_DIR = path.join(__dirname, '..', 'resources', 'aria2');

const PLATFORM_CONFIG = {
  darwin: {
    url: `https://github.com/aria2/aria2/releases/download/release-${ARIA2_VERSION}/aria2-${ARIA2_VERSION}-osx-darwin.tar.gz`,
    binPath: `aria2-${ARIA2_VERSION}/aria2c`,
    extract: 'tar',
  },
  linux: {
    url: `https://github.com/aria2/aria2/releases/download/release-${ARIA2_VERSION}/aria2-${ARIA2_VERSION}-linux-gnu-64bit.tar.gz`,
    binPath: `aria2-${ARIA2_VERSION}/aria2c`,
    extract: 'tar',
  },
  win32: {
    url: `https://github.com/aria2/aria2/releases/download/release-${ARIA2_VERSION}/aria2-${ARIA2_VERSION}-win-64bit-build1.zip`,
    binPath: `aria2-${ARIA2_VERSION}-win-64bit-build1/aria2c.exe`,
    extract: 'zip',
  },
};

function download(url, redirectCount = 0) {
  if (redirectCount > 5) throw new Error('重定向次数过多');
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, { headers: { 'User-Agent': 'multi-user-browser-postinstall' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location, redirectCount + 1).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
        const chunks = [];
        const total = parseInt(res.headers['content-length'] || '0');
        let downloaded = 0;
        res.on('data', (chunk) => {
          chunks.push(chunk);
          downloaded += chunk.length;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            process.stdout.write(`\r下载 aria2c: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)`);
          }
        });
        res.on('end', () => {
          console.log('');
          resolve(Buffer.concat(chunks));
        });
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

async function extractTar(buffer, binPath) {
  const tmpFile = path.join(TARGET_DIR, 'aria2.tar.gz');
  fs.writeFileSync(tmpFile, buffer);
  execSync(`tar xzf "${tmpFile}" -C "${TARGET_DIR}" "${binPath}" --strip-components=1`, {
    stdio: 'inherit',
  });
  fs.unlinkSync(tmpFile);
}

async function extractZip(buffer, binPath) {
  const tmpFile = path.join(TARGET_DIR, 'aria2.zip');
  fs.writeFileSync(tmpFile, buffer);
  execSync(`unzip -o "${tmpFile}" "${binPath}" -d "${TARGET_DIR}"`, { stdio: 'inherit' });
  const src = path.join(TARGET_DIR, binPath);
  const dest = path.join(TARGET_DIR, path.basename(binPath));
  if (src !== dest) {
    fs.renameSync(src, dest);
  }
  const topDir = path.join(TARGET_DIR, binPath.split('/')[0]);
  if (fs.existsSync(topDir)) {
    fs.rmSync(topDir, { recursive: true, force: true });
  }
  fs.unlinkSync(tmpFile);
}

async function main() {
  const platform = process.platform;
  const config = PLATFORM_CONFIG[platform];

  if (!config) {
    console.warn(`⚠️ 不支持的平台: ${platform}，跳过 aria2c 下载`);
    process.exit(0);
  }

  const binName = platform === 'win32' ? 'aria2c.exe' : 'aria2c';
  const destPath = path.join(TARGET_DIR, binName);

  if (fs.existsSync(destPath)) {
    console.log(`✅ aria2c 已存在: ${destPath}`);
    return;
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  console.log(`📥 下载 aria2c v${ARIA2_VERSION} (${platform})...`);
  console.log(`   URL: ${config.url}`);

  const buffer = await download(config.url);

  console.log('📦 解压中...');
  if (config.extract === 'tar') {
    await extractTar(buffer, config.binPath);
  } else {
    await extractZip(buffer, config.binPath);
  }

  if (platform !== 'win32') {
    fs.chmodSync(destPath, 0o755);
  }

  console.log(`✅ aria2c 已安装: ${destPath}`);
}

main().catch((err) => {
  console.error('❌ aria2c 下载失败:', err.message);
  console.error('   请手动下载 aria2c 并放到 resources/aria2/ 目录');
  process.exit(0);
});
