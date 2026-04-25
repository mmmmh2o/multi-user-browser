const { ipcMain } = require('electron');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

const store = new Store({ name: 'history' });

const MAX_HISTORY = 100;

/**
 * 历史记录 IPC Handler
 */
function registerHistoryHandlers() {
  // 获取历史记录
  ipcMain.handle('get-history', async () => {
    try {
      return store.get('history', []);
    } catch (error) {
      log.error('获取历史记录失败:', error);
      return [];
    }
  });

  // 添加历史记录
  ipcMain.handle('add-history', async (event, entry) => {
    try {
      const history = store.get('history', []);

      const newEntry = {
        id: uuidv4(),
        userId: entry.userId,
        title: entry.title,
        url: entry.url,
        visitedAt: Date.now(),
      };

      // 插入到开头
      history.unshift(newEntry);

      // 限制最大条数
      if (history.length > MAX_HISTORY) {
        history.splice(MAX_HISTORY);
      }

      store.set('history', history);
      log.debug(`添加历史: ${entry.title}`);
      return { success: true };
    } catch (error) {
      log.error('添加历史记录失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除单条历史
  ipcMain.handle('delete-history', async (event, historyId) => {
    try {
      let history = store.get('history', []);
      history = history.filter((h) => h.id !== historyId);
      store.set('history', history);
      log.info(`删除历史: ${historyId}`);
      return history;
    } catch (error) {
      log.error('删除历史失败:', error);
      return store.get('history', []);
    }
  });

  // 清空历史记录
  ipcMain.handle('clear-history', async () => {
    try {
      store.set('history', []);
      log.info('历史记录已清空');
      return { success: true };
    } catch (error) {
      log.error('清空历史记录失败:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerHistoryHandlers };
