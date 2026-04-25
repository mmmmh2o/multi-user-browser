const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

/**
 * Preload 脚本 - 通过 contextBridge 安全暴露 API 给渲染进程
 */

// 暴露 webview preload 路径
try {
  const webviewPreloadPath = path.join(__dirname, '../main/preload/webview-preload.js');
  contextBridge.exposeInMainWorld('__MUB_PRELOAD_PATH__', webviewPreloadPath);
} catch (e) {
  console.error('设置 webview preload 路径失败:', e);
  contextBridge.exposeInMainWorld('__MUB_PRELOAD_PATH__', '');
}

// 安全包装 invoke
function safeInvoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args).catch((err) => {
    console.error(`IPC [${channel}] 调用失败:`, err);
    return null;
  });
}

contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 用户管理 ==========
  getUsers: () => safeInvoke('get-users'),
  saveUser: (user) => safeInvoke('save-user', user),
  deleteUser: (id) => safeInvoke('delete-user', id),

  // ========== 会话管理 ==========
  createSession: (userId) => safeInvoke('create-user-session', userId),
  getSession: (userId) => safeInvoke('get-user-session', userId),
  activateUser: (userId) => safeInvoke('activate-user', userId),
  deactivateUser: (userId) => safeInvoke('deactivate-user', userId),
  getUserActivities: () => safeInvoke('get-user-activities'),

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
  pauseDownload: (taskId) => safeInvoke('pause-download', taskId),
  resumeDownload: (taskId) => safeInvoke('resume-download', taskId),
  cancelDownload: (taskId) => safeInvoke('cancel-download', taskId),
  getDownloads: () => safeInvoke('get-downloads'),

  // ========== 书签管理 ==========
  getBookmarks: () => safeInvoke('get-bookmarks'),
  saveBookmark: (bookmark) => safeInvoke('save-bookmark', bookmark),
  deleteBookmark: (id) => safeInvoke('delete-bookmark', id),

  // ========== 历史记录 ==========
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

  // ========== 事件监听（主进程 → 渲染进程） ==========
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  onDownloadCompleted: (callback) => {
    ipcRenderer.on('download-completed', (event, data) => callback(data));
  },
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, data) => callback(data));
  },

  // ========== 移除监听器 ==========
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
