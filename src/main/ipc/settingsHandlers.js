const { ipcMain } = require('electron');
const Store = require('electron-store');
const log = require('electron-log');

const store = new Store({ name: 'settings' });

// 默认设置
const DEFAULTS = {
  defaultDownloadPath: './downloads',
  maxHistoryItems: 100,
  autoStart: false,
  closeToTray: true,
  enableNotification: true,
  enableScripts: true,
  homePage: 'about:blank',
};

/**
 * 设置管理 IPC Handler
 */
function registerSettingsHandlers() {
  // 获取设置
  ipcMain.handle('get-settings', async () => {
    try {
      return { ...DEFAULTS, ...store.store };
    } catch (error) {
      log.error('获取设置失败:', error);
      return DEFAULTS;
    }
  });

  // 保存设置
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      const merged = { ...DEFAULTS, ...store.store, ...settings };
      store.store = merged;
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
      store.store = DEFAULTS;
      log.info('设置已重置');
      return { success: true, settings: DEFAULTS };
    } catch (error) {
      log.error('重置设置失败:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerSettingsHandlers };
