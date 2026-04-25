const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload 脚本 - 通过 contextBridge 安全暴露 API 给渲染进程
 * 
 * 安全原则：
 * - 使用 contextBridge 而非 nodeIntegration
 * - 只暴露必要的 IPC 通道
 * - 不暴露 ipcRenderer 原始对象
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // ========== 用户管理 ==========
  getUsers: () => ipcRenderer.invoke('get-users'),
  saveUser: (user) => ipcRenderer.invoke('save-user', user),
  deleteUser: (id) => ipcRenderer.invoke('delete-user', id),

  // ========== 会话管理 ==========
  createSession: (userId) => ipcRenderer.invoke('create-user-session', userId),
  getSession: (userId) => ipcRenderer.invoke('get-user-session', userId),
  activateUser: (userId) => ipcRenderer.invoke('activate-user', userId),
  deactivateUser: (userId) => ipcRenderer.invoke('deactivate-user', userId),
  getUserActivities: () => ipcRenderer.invoke('get-user-activities'),

  // ========== 文件管理 ==========
  getFiles: (dirPath) => ipcRenderer.invoke('get-files', dirPath),
  createFile: (filePath, content) => ipcRenderer.invoke('create-file', filePath, content),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('rename-file', oldPath, newPath),
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke('copy-file', sourcePath, destPath),
  moveFile: (sourcePath, destPath) => ipcRenderer.invoke('move-file', sourcePath, destPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

  // ========== 下载管理 ==========
  addDownload: (url, savePath) => ipcRenderer.invoke('add-download', url, savePath),
  pauseDownload: (taskId) => ipcRenderer.invoke('pause-download', taskId),
  resumeDownload: (taskId) => ipcRenderer.invoke('resume-download', taskId),
  cancelDownload: (taskId) => ipcRenderer.invoke('cancel-download', taskId),
  getDownloads: () => ipcRenderer.invoke('get-downloads'),

  // ========== 书签管理 ==========
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmark: (bookmark) => ipcRenderer.invoke('save-bookmark', bookmark),
  deleteBookmark: (id) => ipcRenderer.invoke('delete-bookmark', id),

  // ========== 历史记录 ==========
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (entry) => ipcRenderer.invoke('add-history', entry),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // ========== 脚本管理 ==========
  getScripts: () => ipcRenderer.invoke('get-scripts'),
  saveScript: (script) => ipcRenderer.invoke('save-script', script),
  deleteScript: (id) => ipcRenderer.invoke('delete-script', id),

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
