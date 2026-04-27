/**
 * electronAPI 封装工具
 * 提供统一的错误处理和类型安全的 API 调用
 *
 * 注意：方法名必须与 preload/index.js 中 contextBridge.exposeInMainWorld 的 key 一致
 */

const api = window.electronAPI;

if (!api) {
  // eslint-disable-next-line no-console
  console.warn('electronAPI 未加载，请确保在 Electron 环境中运行');
}

/**
 * 安全调用 electronAPI
 * @param {string} method - API 方法名（必须与 preload 暴露的方法名一致）
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
    // eslint-disable-next-line no-console
    console.error(`API 调用失败: ${method}`, error);
    throw error;
  }
}

// ========== 容器身份管理 ==========
export const getContainers = () => call('getContainers');
export const saveContainer = (container) => call('saveContainer', container);
export const deleteContainer = (id) => call('deleteContainer', id);
export const getContainerPartition = (id) => call('getContainerPartition', id);

// ========== 文件管理 ==========
export const getFiles = (dirPath) => call('getFiles', dirPath);
export const createFile = (filePath, content) => call('createFile', filePath, content);
export const createDirectory = (dirPath) => call('createDirectory', dirPath);
export const deleteFile = (filePath) => call('deleteFile', filePath);
export const renameFile = (oldPath, newPath) => call('renameFile', oldPath, newPath);
export const copyFile = (sourcePath, destPath) => call('copyFile', sourcePath, destPath);
export const moveFile = (sourcePath, destPath) => call('moveFile', sourcePath, destPath);
export const readFile = (filePath) => call('readFile', filePath);
export const writeFile = (filePath, content) => call('writeFile', filePath, content);

// ========== 下载管理 ==========
export const addDownload = (url, savePath) => call('addDownload', url, savePath);
export const addBtDownload = (torrentBase64, savePath) => call('addBtDownload', torrentBase64, savePath);
export const pauseDownload = (taskId) => call('pauseDownload', taskId);
export const resumeDownload = (taskId) => call('resumeDownload', taskId);
export const cancelDownload = (taskId) => call('cancelDownload', taskId);
export const retryDownload = (taskId) => call('retryDownload', taskId);
export const deleteDownload = (taskId) => call('deleteDownload', taskId);
export const getDownloads = () => call('getDownloads');
export const getDownloadStats = () => call('getDownloadStats');
export const purgeDownloads = () => call('purgeDownloads');
export const pauseAllDownloads = () => call('pauseAllDownloads');
export const resumeAllDownloads = () => call('resumeAllDownloads');
export const setSpeedLimit = (opts) => call('setSpeedLimit', opts);

// ========== 书签管理 ==========
export const getBookmarks = () => call('getBookmarks');
export const saveBookmark = (bookmark) => call('saveBookmark', bookmark);
export const deleteBookmark = (id) => call('deleteBookmark', id);

// ========== 历史记录 ==========
export const getHistory = () => call('getHistory');
export const addHistory = (entry) => call('addHistory', entry);
export const clearHistory = () => call('clearHistory');
export const deleteHistory = (id) => call('deleteHistory', id);

// ========== 脚本管理 ==========
export const getScripts = () => call('getScripts');
export const saveScript = (script) => call('saveScript', script);
export const deleteScript = (id) => call('deleteScript', id);

// ========== 设置管理 ==========
export const getSettings = () => call('getSettings');
export const saveSettings = (settings) => call('saveSettings', settings);
export const resetSettings = () => call('resetSettings');

// ========== 网络代理 ==========
export const proxyNetRequest = (options) => call('proxyNetRequest', options);

// ========== 事件监听 ==========
export const onDownloadStarted = (callback) => api?.onDownloadStarted?.(callback);
export const onDownloadProgress = (callback) => api?.onDownloadProgress?.(callback);
export const onDownloadCompleted = (callback) => api?.onDownloadCompleted?.(callback);
export const onNotification = (callback) => api?.onNotification?.(callback);
export const removeAllListeners = (channel) => api?.removeAllListeners?.(channel);

export default {
  getContainers, saveContainer, deleteContainer, getContainerPartition,
  getFiles, createFile, createDirectory, deleteFile, renameFile, copyFile, moveFile, readFile, writeFile,
  addDownload, addBtDownload, pauseDownload, resumeDownload, cancelDownload, retryDownload, deleteDownload,
  getDownloads, getDownloadStats, purgeDownloads, pauseAllDownloads, resumeAllDownloads, setSpeedLimit,
  getBookmarks, saveBookmark, deleteBookmark,
  getHistory, addHistory, clearHistory, deleteHistory,
  getScripts, saveScript, deleteScript,
  getSettings, saveSettings, resetSettings,
  proxyNetRequest,
  onDownloadStarted, onDownloadProgress, onDownloadCompleted, onNotification, removeAllListeners,
};
