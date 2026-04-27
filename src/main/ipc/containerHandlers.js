const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

let _store = null;
function getStore() {
  if (!_store) {
    const Store = require('electron-store');
    _store = new Store({ name: 'containers' });
  }
  return _store;
}

// 默认容器
const DEFAULT_CONTAINERS = [
  { id: 'default', name: '默认', color: '#8c8c8c', icon: '🌐' },
];

/**
 * 容器身份管理
 *
 * 容器 = 一个独立的 Cookie/Storage 环境
 * 标签页可以分配到不同容器，实现同一网站多账号同时登录
 * 书签和历史是全局共享的，与容器无关
 */
function registerContainerHandlers() {
  // 获取所有容器
  ipcMain.handle('get-containers', async () => {
    try {
      const containers = getStore().get('containers', DEFAULT_CONTAINERS);
      // 确保默认容器始终存在
      if (!containers.find((c) => c.id === 'default')) {
        containers.unshift(DEFAULT_CONTAINERS[0]);
        getStore().set('containers', containers);
      }
      return containers;
    } catch (error) {
      log.error('获取容器失败:', error);
      return DEFAULT_CONTAINERS;
    }
  });

  // 保存容器（新建或更新）
  ipcMain.handle('save-container', async (event, container) => {
    try {
      const containers = getStore().get('containers', DEFAULT_CONTAINERS);
      const now = Date.now();

      if (container.id) {
        const idx = containers.findIndex((c) => c.id === container.id);
        if (idx !== -1) {
          containers[idx] = { ...containers[idx], ...container, updatedAt: now };
        }
      } else {
        const newContainer = {
          id: uuidv4(),
          name: container.name || '未命名身份',
          color: container.color || '#1677ff',
          icon: container.icon || '🏷️',
          createdAt: now,
        };
        containers.push(newContainer);
        log.info(`新建容器: ${newContainer.name}`);
      }

      getStore().set('containers', containers);
      return container.id
        ? containers.find((c) => c.id === container.id)
        : containers[containers.length - 1];
    } catch (error) {
      log.error('保存容器失败:', error);
      return null;
    }
  });

  // 删除容器（不能删默认容器）
  ipcMain.handle('delete-container', async (event, containerId) => {
    if (containerId === 'default') {
      return { error: '不能删除默认容器' };
    }
    try {
      let containers = getStore().get('containers', DEFAULT_CONTAINERS);
      containers = containers.filter((c) => c.id !== containerId);
      getStore().set('containers', containers);

      // 清理该容器的 session 数据
      const { session } = require('electron');
      const partition = `persist:container-${containerId}`;
      try {
        session.fromPartition(partition).clearStorageData();
      } catch (e) { log.warn('清理容器数据失败:', e.message); }

      log.info(`删除容器: ${containerId}`);
      return containers;
    } catch (error) {
      log.error('删除容器失败:', error);
      return getStore().get('containers', DEFAULT_CONTAINERS);
    }
  });

  // 获取容器的 partition 标识（供 Browser 使用）
  ipcMain.handle('get-container-partition', async (event, containerId) => {
    if (containerId === 'default') return 'persist:default';
    return `persist:container-${containerId}`;
  });
}

module.exports = { registerContainerHandlers };
