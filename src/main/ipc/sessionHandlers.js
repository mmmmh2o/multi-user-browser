const { ipcMain, session } = require('electron');
const log = require('electron-log');

// 会话缓存
const sessionCache = new Map();

// 用户活动状态
const userActivities = new Map();

/**
 * 会话管理 IPC Handler
 * 使用 session.fromPartition 实现用户会话隔离
 */
function registerSessionHandlers() {
  // 创建用户会话
  ipcMain.handle('create-user-session', async (event, userId) => {
    try {
      const partition = `persist:user-${userId}`;
      const userSession = session.fromPartition(partition);

      sessionCache.set(userId, {
        sessionId: partition,
        session: userSession,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      log.info(`创建会话: ${partition}`);
      return { success: true };
    } catch (error) {
      log.error('创建会话失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取用户会话
  ipcMain.handle('get-user-session', async (event, userId) => {
    try {
      const sessionInfo = sessionCache.get(userId);
      if (sessionInfo) {
        return { success: true, sessionId: sessionInfo.sessionId };
      }
      return { success: false, error: '会话不存在' };
    } catch (error) {
      log.error('获取会话失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 激活用户
  ipcMain.handle('activate-user', async (event, userId) => {
    try {
      userActivities.set(userId, {
        isActive: true,
        activatedAt: Date.now(),
        lastActiveAt: Date.now(),
      });
      log.info(`激活用户: ${userId}`);
      return { success: true };
    } catch (error) {
      log.error('激活用户失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 停用用户
  ipcMain.handle('deactivate-user', async (event, userId) => {
    try {
      const activity = userActivities.get(userId);
      if (activity) {
        activity.isActive = false;
        activity.deactivatedAt = Date.now();
        userActivities.set(userId, activity);
      }
      log.info(`停用用户: ${userId}`);
      return { success: true };
    } catch (error) {
      log.error('停用用户失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取所有用户活动状态
  ipcMain.handle('get-user-activities', async () => {
    try {
      const activities = {};
      userActivities.forEach((value, key) => {
        activities[key] = value;
      });
      return activities;
    } catch (error) {
      log.error('获取活动状态失败:', error);
      return {};
    }
  });
}

// 清理用户会话
function destroyUserSession(userId) {
  const sessionInfo = sessionCache.get(userId);
  if (sessionInfo) {
    try {
      // 清除会话数据
      sessionInfo.session.clearStorageData();
      sessionCache.delete(userId);
      userActivities.delete(userId);
      log.info(`销毁会话: user-${userId}`);
    } catch (error) {
      log.error('销毁会话失败:', error);
    }
  }
}

module.exports = { registerSessionHandlers, destroyUserSession };
