const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');
const { registerAllHandlers } = require('./ipc');

// 配置日志
try {
  log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
} catch (e) {
  // app 未就绪时忽略
}
log.info('应用启动');

// 窗口引用
let mainWindow = null;

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
