const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');
const { registerAllHandlers } = require('./ipc');
const { addBrowserDownload } = require('./ipc/downloadHandlers');

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
    event.preventDefault();

    const url = item.getURL();
    const filename = item.getFilename();

    if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('about:')) {
      return;
    }

    log.info(`[下载拦截] ${filename} ← ${url}`);

    // 获取主窗口 webContents 用于推送进度
    const targetWC = mainWindow && !mainWindow.isDestroyed() ? mainWindow.webContents : null;

    addBrowserDownload(url, filename, item.getTotalBytes(), targetWC)
      .then((task) => {
        // 通知渲染进程有新下载（DownloadManager 页面会监听此事件）
        if (targetWC) {
          targetWC.send('download-started', task);
        }
      })
      .catch((err) => {
        log.error(`[下载拦截] aria2 失败，回退原生下载: ${err.message}`);

        // aria2 不可用时 fallback 到 Electron 原生下载
        if (targetWC) {
          dialog.showSaveDialog(mainWindow, {
            defaultPath: filename,
            title: '保存文件',
          }).then((result) => {
            if (!result.canceled && result.filePath) {
              item.setSavePath(result.filePath);
              item.on('updated', () => {
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
              });
            }
          });
        }
      });
  });

  log.info(`[下载拦截] 已注册 session: ${partition}`);
}

/**
 * 监听所有 web-contents 创建，为 webview 注册下载拦截
 */
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    const session = contents.session;
    const partition = session.partition || 'default';
    interceptDownloadsOnSession(session, partition);
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
      sandbox: true,
      webviewTag: true,
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

  log.info('主窗口已创建');
}

app.whenReady().then(() => {
  // 提供 webview preload 路径（sandbox 下 preload 无法用 require('path')）
  ipcMain.handle('__get-webview-preload-path__', () => {
    try {
      return path.join(__dirname, '../main/preload/webview-preload.js');
    } catch {
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
