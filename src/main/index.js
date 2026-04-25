const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('electron-log');

// 配置日志
log.transports.file.resolvePath = () => path.join(app.getPath('userData'), 'logs/main.log');
log.info('应用启动');

// 窗口引用
let mainWindow = null;

// IPC Handler 注册
const { registerUserHandlers } = require('./ipc/userHandlers');
const { registerSessionHandlers } = require('./ipc/sessionHandlers');
const { registerFileHandlers } = require('./ipc/fileHandlers');
const { registerDownloadHandlers } = require('./ipc/downloadHandlers');
const { registerBookmarkHandlers } = require('./ipc/bookmarkHandlers');
const { registerHistoryHandlers } = require('./ipc/historyHandlers');
const { registerScriptHandlers } = require('./ipc/scriptHandlers');

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
    },
  });

  // 开发模式加载 Vite dev server，生产模式加载打包文件
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  log.info('主窗口已创建');
}

function registerAllHandlers() {
  registerUserHandlers();
  registerSessionHandlers();
  registerFileHandlers();
  registerDownloadHandlers();
  registerBookmarkHandlers();
  registerHistoryHandlers();
  registerScriptHandlers();
  log.info('所有 IPC Handler 已注册');
}

app.whenReady().then(() => {
  registerAllHandlers();
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

// 导出给测试用
module.exports = { createWindow, mainWindow };
