/**
 * 网络代理 IPC Handler
 * 为 webview 中的 UserScript 提供跨域请求能力
 * 使用 Electron net 模块，不受同源策略限制
 */

const { ipcMain, net } = require('electron');
const log = require('electron-log');

function registerNetHandlers() {
  ipcMain.handle('proxy-net-request', async (event, options) => {
    const { method = 'GET', url, headers = {}, body, timeout = 30000 } = options || {};

    if (!url) {
      return { error: '缺少 url 参数' };
    }

    return new Promise((resolve) => {
      const req = net.request({
        method,
        url,
        // 不受同源策略限制
      });

      // 设置请求头
      for (const [key, value] of Object.entries(headers)) {
        req.setHeader(key, value);
      }

      // 超时处理
      const timer = setTimeout(() => {
        req.abort();
        resolve({ error: '请求超时' });
      }, timeout);

      req.on('response', (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          clearTimeout(timer);
          const responseText = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: response.statusCode,
            statusText: response.statusMessage || '',
            responseHeaders: response.headers,
            responseText,
            readyState: 4,
          });
        });
        response.on('error', (err) => {
          clearTimeout(timer);
          resolve({ error: err.message });
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        resolve({ error: err.message });
      });

      // 发送请求体
      if (body) {
        req.write(body);
      }
      req.end();
    });
  });

  log.info('[NetHandlers] proxy-net-request 已注册');
}

module.exports = { registerNetHandlers };
