const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { registerAllHandlers } = require('./ipc');
const { addBrowserDownload } = require('./ipc/downloadHandlers');

// ========== GPU / 渲染稳定性修复 ==========
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
// 禁用 site-per-process 隔离（减少 OOPIF 崩溃）
app.commandLine.appendSwitch('disable-site-isolation-trials');
// 允许 webview 安全降级
app.commandLine.appendSwitch('allow-insecure-localhost');
// 禁用 Chromium 控制台日志（Windows 下会弹出终端窗口）
// 使用 electron-log 记录日志即可
// app.commandLine.appendSwitch('enable-logging');
// app.commandLine.appendSwitch('v', '0');

// 配置日志
try {
  log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
} catch (e) {
  // app 未就绪时忽略
}
log.info('应用启动');

// 窗口引用
let mainWindow = null;

// ========== 浏览器下载拦截 ==========
const registeredSessions = new Set();

/**
 * 为 webview session 注册下载拦截
 * 当用户在浏览器中点击下载链接时，取消 Electron 原生下载，转交给 aria2
 */
function interceptDownloadsOnSession(session, partition) {
  if (registeredSessions.has(partition)) return;
  registeredSessions.add(partition);

  session.on('will-download', (event, item, _webContents) => {
    const url = item.getURL();
    const filename = item.getFilename();

    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
      return;
    }

    log.info(`[下载拦截] ${filename} ← ${url}`);

    // 获取主窗口 webContents 用于推送进度
    const targetWC = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;

    // 先不阻止原生下载，异步尝试 aria2
    // 如果 aria2 可用，再取消原生下载并转交 aria2
    let nativeDownloadStarted = false;

    // 原生下载进度监听（作为 fallback）
    item.on('updated', () => {
      if (!nativeDownloadStarted) {
        nativeDownloadStarted = true;
        log.info(`[原生下载] 已开始: ${filename}`);
      }
      if (targetWC && !targetWC.isDestroyed()) {
        targetWC.send('download-progress-native', {
          filename,
          receivedBytes: item.getReceivedBytes(),
          totalBytes: item.getTotalBytes(),
        });
      }
    });
    item.on('done', (e, state) => {
      log.info(`[原生下载] ${filename}: ${state}`);
      if (targetWC && !targetWC.isDestroyed()) {
        targetWC.send('download-completed-native', { filename, state });
      }
    });

    // 异步尝试 aria2
    addBrowserDownload(url, filename, item.getTotalBytes(), targetWC)
      .then((task) => {
        // aria2 成功 → 取消原生下载
        if (!nativeDownloadStarted) {
          item.cancel();
          log.info(`[下载拦截] 已取消原生下载，转交 aria2: ${filename}`);
        } else {
          log.warn(`[下载拦截] 原生下载已在进行中，无法转交 aria2: ${filename}`);
        }
        if (targetWC) {
          targetWC.send('download-started', task);
        }
      })
      .catch((err) => {
        // aria2 失败 → 原生下载继续（已自动开始）
        log.error(`[下载拦截] aria2 不可用 (${err.message})，使用原生下载: ${filename}`);
        if (targetWC) {
          targetWC.send('notification', {
            type: 'warning',
            message: `下载引擎不可用，已使用浏览器原生下载: ${filename}`,
          });
        }
      });
  });

  log.info(`[下载拦截] 已注册 session: ${partition}`);
}

/**
 * 监听所有 web-contents 创建，为 webview 注册下载拦截 + 新窗口拦截
 */
app.on('web-contents-created', (event, contents) => {
  const type = contents.getType();
  log.info(`[web-contents-created] type=${type} id=${contents.id}`);

  if (type === 'webview') {
    const session = contents.session;
    const partition = session.partition || 'default';
    interceptDownloadsOnSession(session, partition);

    // 方案 1: setWindowOpenHandler
    try {
      contents.setWindowOpenHandler(({ url, disposition }) => {
        log.info(`[setWindowOpenHandler] url=${url} disposition=${disposition}`);
        if (url && url !== 'about:blank' && mainWindow && !mainWindow.isDestroyed()) {
          log.info(`[setWindowOpenHandler] → IPC open-url-in-tab: ${url}`);
          mainWindow.webContents.send('open-url-in-tab', url);
        }
        return { action: 'deny' };
      });
      log.info(`[setWindowOpenHandler] registered on webview ${contents.id}`);
    } catch (e) {
      log.error(`[setWindowOpenHandler] failed:`, e.message);
    }

    // 方案 2: will-navigate 拦截（target=_blank 在某些情况下走这条路）
    contents.on('will-navigate', (event, url) => {
      log.info(`[will-navigate] url=${url}`);
    });

    // 方案 3: 监听 console 输出，方便调试
    contents.on('console-message', (e, level, message) => {
      if (message.includes('[MUB-DEBUG]')) {
        log.info(`[webview console] ${message}`);
      }
    });

    // 方案 4: dom-ready 后注入点击拦截脚本
    // 将 target=_blank 链接改为通过 IPC 在新标签页打开
    contents.on('dom-ready', () => {
      log.info(`[dom-ready] webview ${contents.id} ready, injecting link interceptor`);
      contents.executeJavaScript(`
        document.addEventListener('click', function(e) {
          var link = e.target.closest('a[href]');
          if (link && link.target === '_blank') {
            e.preventDefault();
            var url = link.href;
            console.log('[MUB-DEBUG] intercepted target=_blank: ' + url);
            // 通过 webview 的 postMessage 通知渲染进程
            // 渲染进程会监听 webview 的 console-message 来捕获
            // 但我们直接用 window.open(url, '_self') 让 will-navigate 来处理
            // 或者直接在同一窗口导航
            window.location.href = url;
          }
        }, true);
        console.log('[MUB-DEBUG] link interceptor injected');
      `).catch(() => {});
    });
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Multi-User Browser',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true,
      // 关键：允许 webview 跨域加载外部网站
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // 开发模式加载 Vite dev server，生产模式加载打包文件
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 渲染进程崩溃恢复
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log.error(`[崩溃] 渲染进程异常退出: reason=${details.reason}, exitCode=${details.exitCode}`);
    if (details.reason === 'crashed' || details.reason === 'oom') {
      log.info('[崩溃] 尝试重新加载主窗口...');
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 1000);
    }
  });

  log.info('主窗口已创建');
}

app.whenReady().then(() => {
  // 提供 webview preload 路径（sandbox 下 preload 无法用 require('path')）
  ipcMain.handle('__get-webview-preload-path__', () => {
    try {
      const preloadPath = path.join(__dirname, '../main/preload/webview-preload.js');
      log.info(`[Preload] webview preload 路径: ${preloadPath}`);
      return preloadPath;
    } catch (e) {
      log.error('[Preload] 获取 webview preload 路径失败:', e);
      return '';
    }
  });

  registerAllHandlers();
  log.info('所有 IPC Handler 已注册');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('应用即将退出');
});

module.exports = { createWindow };
