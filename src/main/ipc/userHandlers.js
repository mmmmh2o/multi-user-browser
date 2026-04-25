const { ipcMain } = require('electron');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');

const store = new Store({ name: 'users' });

/**
 * 用户管理 IPC Handler
 */
function registerUserHandlers() {
  // 获取所有用户
  ipcMain.handle('get-users', async () => {
    try {
      const users = store.get('users', []);
      log.debug(`获取用户列表: ${users.length} 个用户`);
      return users;
    } catch (error) {
      log.error('获取用户列表失败:', error);
      return [];
    }
  });

  // 保存用户（新建或更新）
  ipcMain.handle('save-user', async (event, user) => {
    try {
      const users = store.get('users', []);
      const now = Date.now();

      if (user.id) {
        // 更新现有用户
        const index = users.findIndex((u) => u.id === user.id);
        if (index !== -1) {
          users[index] = { ...users[index], ...user, updatedAt: now };
          log.info(`更新用户: ${user.id}`);
        } else {
          log.warn(`用户不存在: ${user.id}`);
          return null;
        }
      } else {
        // 新建用户
        const newUser = {
          id: uuidv4(),
          name: user.name,
          email: user.email || '',
          avatar: user.avatar || '',
          createdAt: now,
          updatedAt: now,
          isActive: false,
        };
        users.push(newUser);
        log.info(`新建用户: ${newUser.id} (${newUser.name})`);
      }

      store.set('users', users);
      return user.id ? users.find((u) => u.id === user.id) : users[users.length - 1];
    } catch (error) {
      log.error('保存用户失败:', error);
      return null;
    }
  });

  // 删除用户
  ipcMain.handle('delete-user', async (event, userId) => {
    try {
      let users = store.get('users', []);
      const before = users.length;
      users = users.filter((u) => u.id !== userId);
      store.set('users', users);
      log.info(`删除用户: ${userId} (剩余 ${users.length} 个)`);
      return users;
    } catch (error) {
      log.error('删除用户失败:', error);
      return store.get('users', []);
    }
  });
}

module.exports = { registerUserHandlers };
