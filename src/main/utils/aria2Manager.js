const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

const RPC_PORT = 6800;
const RPC_HOST = '127.0.0.1';

let aria2cProcess = null;
let rpcId = 0;
let starting = null;

/**
 * 获取 aria2c 二进制路径
 */
function getAria2cPath() {
  const { app } = require('electron');
  const binName = process.platform === 'win32' ? 'aria2c.exe' : 'aria2c';
  if (app && app.isPackaged) {
    return path.join(process.resourcesPath, 'aria2', binName);
  }
  return path.join(__dirname, '..', '..', '..', 'resources', 'aria2', binName);
}

/**
 * 启动 aria2c RPC 服务
 */
async function start() {
  if (aria2cProcess) return;
  if (starting) return starting;

  starting = new Promise((resolve, reject) => {
    const aria2cPath = getAria2cPath();

    if (!fs.existsSync(aria2cPath)) {
      const err = new Error(`aria2c 未找到: ${aria2cPath}`);
      log.error(err.message);
      reject(err);
      return;
    }

    const args = [
      '--enable-rpc',
      `--rpc-listen-port=${RPC_PORT}`,
      '--rpc-allow-origin-all=false',
      '--check-integrity=false',
      '--continue=true',
      '--max-connection-per-server=4',
      '--split=4',
      '--min-split-size=1M',
      '--auto-file-renaming=false',
      '--allow-overwrite=true',
      '--disk-cache=16M',
      '--file-allocation=falloc',
      '--quiet=true',
      '--console-log-level=warn',
    ];

    log.info(`启动 aria2c: ${aria2cPath}`);
    aria2cProcess = spawn(aria2cPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    aria2cProcess.stdout.on('data', (data) => {
      log.debug(`aria2c stdout: ${data.toString().trim()}`);
    });

    aria2cProcess.stderr.on('data', (data) => {
      log.warn(`aria2c stderr: ${data.toString().trim()}`);
    });

    aria2cProcess.on('error', (err) => {
      log.error('aria2c 进程错误:', err);
      aria2cProcess = null;
      starting = null;
      reject(err);
    });

    aria2cProcess.on('exit', (code) => {
      log.warn(`aria2c 退出, code=${code}`);
      aria2cProcess = null;
      starting = null;
    });

    // 等待 RPC 端口就绪
    const maxRetries = 20;
    let retries = 0;
    const checkReady = () => {
      rpcCall('aria2.getVersion', [])
        .then(() => {
          log.info('aria2c RPC 就绪');
          starting = null;
          resolve();
        })
        .catch(() => {
          retries++;
          if (retries >= maxRetries) {
            starting = null;
            reject(new Error('aria2c RPC 启动超时'));
            return;
          }
          setTimeout(checkReady, 250);
        });
    };
    setTimeout(checkReady, 500);
  });

  return starting;
}

/**
 * JSON-RPC 调用
 */
function rpcCall(method, params = []) {
  return new Promise((resolve, reject) => {
    const id = ++rpcId;
    const body = JSON.stringify({ jsonrpc: '2.0', id, method, params });

    const req = http.request(
      {
        hostname: RPC_HOST,
        port: RPC_PORT,
        path: '/jsonrpc',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 10000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(json.error.message));
            } else {
              resolve(json.result);
            }
          } catch (e) {
            reject(new Error(`RPC 响应解析失败: ${data}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('RPC 请求超时'));
    });

    req.write(body);
    req.end();
  });
}

/**
 * 添加下载任务
 */
async function addDownload(url, filename, dir) {
  await start();
  const options = {};
  if (filename) {
    options.out = filename;
  }
  if (dir) {
    options.dir = dir;
  }
  const gid = await rpcCall('aria2.addUri', [[url], options]);
  log.info(`aria2 添加下载: ${url} → GID=${gid}${dir ? ` dir=${dir}` : ''}`);
  return gid;
}

/**
 * 暂停下载
 */
async function pause(gid) {
  return rpcCall('aria2.pause', [gid]);
}

/**
 * 恢复下载
 */
async function unpause(gid) {
  return rpcCall('aria2.unpause', [gid]);
}

/**
 * 取消下载
 */
async function remove(gid) {
  try {
    return await rpcCall('aria2.remove', [gid]);
  } catch {
    return rpcCall('aria2.forceRemove', [gid]);
  }
}

/**
 * 查询任务状态
 */
async function tellStatus(gid) {
  return rpcCall('aria2.tellStatus', [gid]);
}

/**
 * 获取全局统计
 */
async function getGlobalStat() {
  return rpcCall('aria2.getGlobalStat', []);
}

/**
 * 获取所有活跃下载
 */
async function tellActive() {
  return rpcCall('aria2.tellActive', []);
}

/**
 * 获取下载目录
 */
function getDownloadDir() {
  const { app } = require('electron');
  if (app) {
    return path.join(app.getPath('downloads'), 'multi-user-browser');
  }
  return path.join(require('os').homedir(), 'Downloads', 'multi-user-browser');
}

/**
 * 添加 BT/Magnet 下载
 * @param {string} torrentBase64 - base64 编码的 .torrent 文件内容
 * @param {string} dir - 保存目录
 */
async function addTorrent(torrentBase64, dir) {
  await start();
  const options = {};
  if (dir) options.dir = dir;
  const gid = await rpcCall('aria2.addTorrent', [torrentBase64, [], options]);
  log.info(`aria2 添加 BT 下载: GID=${gid}`);
  return gid;
}

/**
 * 设置 aria2 选项
 * @param {'global-option'|'local-option'} scope - 选项作用域
 * @param {string} key - 选项名
 * @param {string} value - 选项值
 */
async function setOption(scope, key, value) {
  const method = scope === 'local-option' ? 'aria2.changeOption' : 'aria2.changeGlobalOption';
  return rpcCall(method, [key, value]);
}

/**
 * 停止 aria2c
 */
function stop() {
  if (aria2cProcess) {
    rpcCall('aria2.shutdown', []).catch(() => {});
    setTimeout(() => {
      if (aria2cProcess) {
        aria2cProcess.kill();
        aria2cProcess = null;
      }
    }, 1000);
  }
}

module.exports = {
  start,
  stop,
  addDownload,
  addTorrent,
  pause,
  unpause,
  remove,
  tellStatus,
  tellActive,
  getGlobalStat,
  rpcCall,
  getDownloadDir,
  setOption,
};
