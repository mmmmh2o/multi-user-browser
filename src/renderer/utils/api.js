/**
 * electronAPI 封装工具
 * 提供统一的错误处理和类型安全的 API 调用
 */

const api = window.electronAPI;

if (!api) {
  console.warn('electronAPI 未加载，请确保在 Electron 环境中运行');
}

/**
 * 安全调用 electronAPI
 * @param {string} method - API 方法名
 * @param  {...any} args - 参数
 * @returns {Promise<any>}
 */
async function call(method, ...args) {
  if (!api || !api[method]) {
    throw new Error(`API 方法不存在: ${method}`);
  }
  try {
    return await api[method](...args);
  } catch (error) {
    console.error(`API 调用失败: ${method}`, error);
    throw error;
  }
}

// ========== 用户管理 ==========
export const getUsers = () => call('getUsers');
export const saveUser = (user) => call('saveUser', user);
export const deleteUser = (id) => call('deleteUser', id);

// ========== 会话管理 ==========
export const createSession = (userId) => call('createSession', userId);
export const getSession = (userId) => call('getSession', userId);
export const activateUser = (userId) => call('activateUser', userId);
export const deactivateUser = (userId) => call('deactivateUser', userId);
export const getUserActivities = () => call('getUserActivities');

// ========== 文件管理 ==========
export const getFiles = (dirPath) => call('getFiles', dirPath);
export const createFile = (filePath, content) => call('createFile', filePath, content);
export const createDirectory = (dirPath) => call('createDirectory', dirPath);
export const deleteFile = (filePath) => call('deleteFile', filePath);
export const renameFile = (oldPath, newPath) => call('renameFile', oldPath, newPath);
export const copyFile = (src, dest) => call('copyFile', src, dest);
export const moveFile = (src, dest) => call('moveFile', src, dest);
export const readFile = (filePath) => call('readFile', filePath);
export const writeFile = (filePath, content) => call('writeFile', filePath, content);

// ========== 下载管理 ==========
export const addDownload = (url, savePath) => call('addDownload', url, savePath);
export const pauseDownload = (taskId) => call('pauseDownload', taskId);
export const resumeDownload = (taskId) => call('resumeDownload', taskId);
export const cancelDownload = (taskId) => call('cancelDownload', taskId);
export const getDownloads = () => call('getDownloads');

// ========== 书签管理 ==========
export const getBookmarks = () => call('getBookmarks');
export const saveBookmark = (bookmark) => call('saveBookmark', bookmark);
export const deleteBookmark = (id) => call('deleteBookmark', id);

// ========== 历史记录 ==========
export const getHistory = () => call('getHistory');
export const addHistory = (entry) => call('addHistory', entry);
export const clearHistory = () => call('clearHistory');

// ========== 脚本管理 ==========
export const getScripts = () => call('getScripts');
export const saveScript = (script) => call('saveScript', script);
export const deleteScript = (id) => call('deleteScript', id);

// ========== 事件监听 ==========
export const onDownloadProgress = (callback) => api?.onDownloadProgress(callback);
export const onDownloadCompleted = (callback) => api?.onDownloadCompleted(callback);
export const onNotification = (callback) => api?.onNotification(callback);
export const removeAllListeners = (channel) => api?.removeAllListeners(channel);

// ========== 设置管理 ==========
export const getSettings = () => call('getSettings');
export const saveSettings = (settings) => call('saveSettings', settings);
export const resetSettings = () => call('resetSettings');

export default {
  getUsers, saveUser, deleteUser,
  createSession, getSession, activateUser, deactivateUser, getUserActivities,
  getFiles, createFile, createDirectory, deleteFile, renameFile, copyFile, moveFile, readFile, writeFile,
  addDownload, pauseDownload, resumeDownload, cancelDownload, getDownloads,
  getBookmarks, saveBookmark, deleteBookmark,
  getHistory, addHistory, clearHistory,
  getScripts, saveScript, deleteScript,
  getSettings, saveSettings, resetSettings,
  onDownloadProgress, onDownloadCompleted, onNotification, removeAllListeners,
};
