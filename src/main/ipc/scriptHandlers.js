const { ipcMain } = require('electron');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

const store = new Store({ name: 'scripts' });

/**
 * 脚本管理 IPC Handler
 */
function registerScriptHandlers() {
  // 获取所有脚本
  ipcMain.handle('get-scripts', async () => {
    try {
      return store.get('scripts', []);
    } catch (error) {
      log.error('获取脚本失败:', error);
      return [];
    }
  });

  // 保存脚本
  ipcMain.handle('save-script', async (event, script) => {
    try {
      const scripts = store.get('scripts', []);
      const now = Date.now();

      if (script.id) {
        // 更新
        const index = scripts.findIndex((s) => s.id === script.id);
        if (index !== -1) {
          scripts[index] = { ...scripts[index], ...script, updatedAt: now };
          log.info(`更新脚本: ${script.id}`);
        }
      } else {
        // 新建
        const newScript = {
          id: uuidv4(),
          userId: script.userId,
          name: script.name,
          url: script.url || '',
          code: script.code || '',
          enabled: script.enabled || false,
          createdAt: now,
          updatedAt: now,
        };
        scripts.push(newScript);
        log.info(`新建脚本: ${newScript.name}`);
      }

      store.set('scripts', scripts);
      return script.id
        ? scripts.find((s) => s.id === script.id)
        : scripts[scripts.length - 1];
    } catch (error) {
      log.error('保存脚本失败:', error);
      return null;
    }
  });

  // 获取已启用的脚本（供 webview preload 注入用）
  ipcMain.handle('get-enabled-scripts', async () => {
    try {
      const scripts = store.get('scripts', []);
      return scripts.filter((s) => s.enabled);
    } catch (error) {
      log.error('获取启用脚本失败:', error);
      return [];
    }
  });

  // 删除脚本
  ipcMain.handle('delete-script', async (event, scriptId) => {
    try {
      let scripts = store.get('scripts', []);
      scripts = scripts.filter((s) => s.id !== scriptId);
      store.set('scripts', scripts);
      log.info(`删除脚本: ${scriptId}`);
      return scripts;
    } catch (error) {
      log.error('删除脚本失败:', error);
      return store.get('scripts', []);
    }
  });
}

module.exports = { registerScriptHandlers };
