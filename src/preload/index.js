const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload 脚本 - 通过 contextBridge 安全暴露 API 给渲染进程
 */

// 暴露 webview preload 路径
ipcRenderer.invoke('__get-webview-preload-path__').then((p) => {
  contextBridge.exposeInMainWorld('__MUB_PRELOAD_PATH__', p || '');
}).catch(() => {
  contextBridge.exposeInMainWorld('__MUB_PRELOAD_PATH__', '');
});

function safeInvoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args).catch((err) => {
    console.error(`[Preload] IPC [${channel}] 调用失败:`, err);
    return null;
  });
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 容器身份管理 ==========
  getContainers: () => safeInvoke('get-containers'),
  saveContainer: (container) => safeInvoke('save-container', container),
  deleteContainer: (id) => safeInvoke('delete-container', id),
  getContainerPartition: (id) => safeInvoke('get-container-partition', id),

  // ========== 文件管理 ==========
  getFiles: (dirPath) => safeInvoke('get-files', dirPath),
  createFile: (filePath, content) => safeInvoke('create-file', filePath, content),
  createDirectory: (dirPath) => safeInvoke('create-directory', dirPath),
  deleteFile: (filePath) => safeInvoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => safeInvoke('rename-file', oldPath, newPath),
  copyFile: (sourcePath, destPath) => safeInvoke('copy-file', sourcePath, destPath),
  moveFile: (sourcePath, destPath) => safeInvoke('move-file', sourcePath, destPath),
  readFile: (filePath) => safeInvoke('read-file', filePath),
  writeFile: (filePath, content) => safeInvoke('write-file', filePath, content),

  // ========== 下载管理 ==========
  addDownload: (url, savePath) => safeInvoke('add-download', url, savePath),
  addBtDownload: (torrentBase64, savePath) => safeInvoke('add-bt-download', torrentBase64, savePath),
  pauseDownload: (taskId) => safeInvoke('pause-download', taskId),
  resumeDownload: (taskId) => safeInvoke('resume-download', taskId),
  cancelDownload: (taskId) => safeInvoke('cancel-download', taskId),
  retryDownload: (taskId) => safeInvoke('retry-download', taskId),
  deleteDownload: (taskId) => safeInvoke('delete-download', taskId),
  getDownloads: () => safeInvoke('get-downloads'),
  getDownloadStats: () => safeInvoke('get-download-stats'),
  purgeDownloads: () => safeInvoke('purge-downloads'),
  pauseAllDownloads: () => safeInvoke('pause-all-downloads'),
  resumeAllDownloads: () => safeInvoke('resume-all-downloads'),
  setSpeedLimit: (opts) => safeInvoke('set-speed-limit', opts),

  // ========== 书签管理（全局共享） ==========
  getBookmarks: () => safeInvoke('get-bookmarks'),
  saveBookmark: (bookmark) => safeInvoke('save-bookmark', bookmark),
  deleteBookmark: (id) => safeInvoke('delete-bookmark', id),

  // ========== 历史记录（全局共享） ==========
  getHistory: () => safeInvoke('get-history'),
  addHistory: (entry) => safeInvoke('add-history', entry),
  clearHistory: () => safeInvoke('clear-history'),
  deleteHistory: (id) => safeInvoke('delete-history', id),

  // ========== 脚本管理 ==========
  getScripts: () => safeInvoke('get-scripts'),
  saveScript: (script) => safeInvoke('save-script', script),
  deleteScript: (id) => safeInvoke('delete-script', id),

  // ========== 设置管理 ==========
  getSettings: () => safeInvoke('get-settings'),
  saveSettings: (settings) => safeInvoke('save-settings', settings),
  resetSettings: () => safeInvoke('reset-settings'),

  // ========== 网络代理 ==========
  proxyNetRequest: (options) => safeInvoke('proxy-net-request', options),

  // ========== 事件监听 ==========
  onDownloadStarted: (callback) => {
    ipcRenderer.on('download-started', (event, data) => callback(data));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadCompleted: (callback) => {
    ipcRenderer.on('download-completed', (event, data) => callback(data));
  },
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, data) => callback(data));
  },
  onOpenUrlInTab: (callback) => {
    ipcRenderer.on('open-url-in-tab', (event, url) => callback(url));
  },
  removeOpenUrlInTab: () => {
    ipcRenderer.removeAllListeners('open-url-in-tab');
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

contextBridge.exposeInMainWorld('__MUB_PRELOAD_READY__', true);
