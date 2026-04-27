const { ipcMain } = require('electron');

const log = require('electron-log');

let _store = null;
function getStore() {
  if (!_store) {
    const Store = require('electron-store');
    _store = new Store({ name: 'settings' });
  }
  return _store;
}

// 默认设置
const DEFAULTS = {
  homepage: 'about:blank',
  searchEngine: 'baidu',
  maxHistory: 100,
  darkMode: false,
  fontSize: 'medium',
  downloadPath: '',
  autoClassify: false,
  autoStart: false,
  closeToTray: true,
  enableNotification: true,
  enableScripts: true,
  // 下载设置
  maxConcurrentDownloads: 5,
  maxDownloadSpeed: 0,      // 0 = 不限速，单位 KB/s
  maxUploadSpeed: 0,         // 0 = 不限速，单位 KB/s
};

/**
 * 设置管理 IPC Handler
 */
function registerSettingsHandlers() {
  // 获取设置
  ipcMain.handle('get-settings', async () => {
    try {
      return { ...DEFAULTS, ...getStore().store };
    } catch (error) {
      log.error('获取设置失败:', error);
      return DEFAULTS;
    }
  });

  // 保存设置
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const merged = { ...DEFAULTS, ...getStore().store, ...settings };
      getStore().store = merged;
      log.info('设置已保存');
      return { success: true, settings: merged };
    } catch (error) {
      log.error('保存设置失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 重置设置
  ipcMain.handle('reset-settings', async () => {
    try {
      getStore().store = DEFAULTS;
      log.info('设置已重置');
      return { success: true, settings: DEFAULTS };
    } catch (error) {
      log.error('重置设置失败:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerSettingsHandlers };
