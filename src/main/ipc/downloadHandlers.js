const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const log = require('electron-log');
const aria2 = require('../utils/aria2Manager');
const { classifyFile } = require('../utils/fileClassifier');

// 任务映射: taskId → { gid, ... }
const taskMap = new Map();
let store = null;
let pollTimer = null;

function getStore() {
  if (!store) {
    const Store = require('electron-store');
    store = new Store({ name: 'downloads' });
  }
  return store;
}

function aria2StatusToTaskStatus(aria2Status) {
  const map = {
    active: 'downloading',
    waiting: 'pending',
    paused: 'paused',
    error: 'failed',
    complete: 'completed',
    removed: 'cancelled',
  };
  return map[aria2Status] || 'pending';
}

/**
 * 启动进度轮询
 */
function startProgressPoller(webContents) {
  if (pollTimer) return;
  pollTimer = setInterval(async () => {
    try {
      const active = await aria2.tellActive();
      for (const item of active) {
        for (const [taskId, info] of taskMap.entries()) {
          if (info.gid === item.gid || info.gid === item.following) {
            const downloadedSize = parseInt(item.completedLength || '0');
            const totalSize = parseInt(item.totalLength || '0');
            const progress = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
            const speed = parseInt(item.downloadSpeed || '0');

            updateTaskField(taskId, 'downloadedSize', downloadedSize);
            updateTaskField(taskId, 'totalSize', totalSize);
            updateTaskField(taskId, 'progress', progress);
            updateTaskField(taskId, 'speed', speed);
            updateTaskStatus(taskId, 'downloading');

            if (webContents && !webContents.isDestroyed()) {
              webContents.send('download-progress', {
                id: taskId,
                downloadedSize,
                totalSize,
                progress,
                speed,
              });
            }
          }
        }
      }

      // 检查已完成/失败的任务
      const stopped = await aria2.rpcCall('aria2.tellStopped', [0, 100]);
      for (const item of stopped) {
        for (const [taskId, info] of taskMap.entries()) {
          if (info.gid === item.gid) {
            const status = aria2StatusToTaskStatus(item.status);
            if (info.notified) continue;

            updateTaskStatus(taskId, status);
            info.notified = true;

            if (status === 'completed') {
              const filename = item.files && item.files[0] && item.files[0].path
                ? path.basename(item.files[0].path)
                : info.filename;
              updateTaskField(taskId, 'completedAt', Date.now());
              if (webContents && !webContents.isDestroyed()) {
                webContents.send('download-completed', {
                  id: taskId,
                  filename,
                  path: item.files && item.files[0] && item.files[0].path,
                });
              }
              log.info(`下载完成: ${taskId} (${item.gid})`);
              checkAndStopPoller();
            } else if (status === 'failed') {
              if (webContents && !webContents.isDestroyed()) {
                webContents.send('download-progress', {
                  id: taskId,
                  downloadedSize: parseInt(item.completedLength || '0'),
                  totalSize: parseInt(item.totalLength || '0'),
                  progress: 0,
                  status: 'failed',
                  error: item.errorMessage || '下载失败',
                });
              }
              log.error(`下载失败: ${taskId} - ${item.errorMessage}`);
              checkAndStopPoller();
            }
          }
        }
      }
    } catch (err) {
      log.debug('进度轮询错误:', err.message);
    }
  }, 1000);
}

function stopProgressPoller() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * 检查是否还有活跃任务，没有就停止轮询
 */
function checkAndStopPoller() {
  if (!pollTimer) return;
  // 检查 taskMap 里是否还有非终态的任务
  const terminalStatuses = ['completed', 'failed', 'cancelled'];
  const tasks = getStore().get('tasks', []);
  const hasActive = tasks.some((t) => !terminalStatuses.includes(t.status));
  if (!hasActive) {
    stopProgressPoller();
    log.debug('所有下载任务已完成，轮询器已停止');
  }
}

/**
 * 浏览器下载拦截入口 — 供 main/index.js 调用
 * 与 IPC add-download 共享相同的 taskMap / store / 轮询器
 */
async function addBrowserDownload(url, filename, totalBytes, webContents) {
  try {
    await aria2.start();

    const taskId = uuidv4();
    const category = classifyFile(filename);
    const downloadBase = aria2.getDownloadDir();
    const categoryDir = path.join(downloadBase, category);
    const aria2Gid = await aria2.addDownload(url, filename, categoryDir);

    const task = {
      id: taskId,
      url,
      savePath: path.join(categoryDir, filename),
      filename,
      totalSize: totalBytes || 0,
      downloadedSize: 0,
      progress: 0,
      speed: 0,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
      source: 'browser', // 标记来源：浏览器点击下载
    };

    taskMap.set(taskId, { gid: aria2Gid, filename, notified: false });

    const tasks = getStore().get('tasks', []);
    tasks.push(task);
    getStore().set('tasks', tasks);

    // 用主窗口 webContents 启动轮询（确保进度能推送到渲染进程）
    startProgressPoller(webContents);

    log.info(`[浏览器下载] ${filename} → aria2 GID=${aria2Gid}`);
    return task;
  } catch (error) {
    log.error('[浏览器下载] 转交 aria2 失败:', error.message);
    throw error;
  }
}

function registerDownloadHandlers() {
  // 添加下载任务
  ipcMain.handle('add-download', async (event, url, _savePath) => {
    try {
      const taskId = uuidv4();
      const urlObj = new URL(url);
      const fileName = path.basename(urlObj.pathname) || `download_${taskId}`;
      const category = classifyFile(fileName);

      // 构造分类子目录路径，传给 aria2
      const downloadBase = aria2.getDownloadDir();
      const categoryDir = path.join(downloadBase, category);
      const aria2Gid = await aria2.addDownload(url, fileName, categoryDir);

      const task = {
        id: taskId,
        url,
        savePath: path.join(categoryDir, fileName),
        filename: fileName,
        totalSize: 0,
        downloadedSize: 0,
        progress: 0,
        speed: 0,
        status: 'pending',
        createdAt: Date.now(),
        completedAt: null,
      };

      // 保存任务映射
      taskMap.set(taskId, { gid: aria2Gid, filename: fileName, notified: false });

      // 持久化
      const tasks = getStore().get('tasks', []);
      tasks.push(task);
      getStore().set('tasks', tasks);

      // 启动轮询
      startProgressPoller(event.sender);

      log.info(`添加下载: ${fileName} → aria2 GID=${aria2Gid}`);
      return task;
    } catch (error) {
      log.error('添加下载失败:', error);
      return { error: error.message };
    }
  });

  // 暂停下载
  ipcMain.handle('pause-download', async (event, taskId) => {
    try {
      const info = taskMap.get(taskId);
      if (!info) return { success: false, error: '任务不存在' };

      await aria2.pause(info.gid);
      updateTaskStatus(taskId, 'paused');
      log.info(`暂停下载: ${taskId}`);
      return { success: true };
    } catch (error) {
      log.error('暂停下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 恢复下载
  ipcMain.handle('resume-download', async (event, taskId) => {
    try {
      const info = taskMap.get(taskId);
      if (!info) return { success: false, error: '任务不存在' };

      await aria2.unpause(info.gid);
      updateTaskStatus(taskId, 'downloading');
      startProgressPoller(event.sender);
      log.info(`恢复下载: ${taskId}`);
      return { success: true };
    } catch (error) {
      log.error('恢复下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 取消下载
  ipcMain.handle('cancel-download', async (event, taskId) => {
    try {
      const info = taskMap.get(taskId);
      if (info) {
        await aria2.remove(info.gid).catch(() => {});
        taskMap.delete(taskId);
      }

      const tasks = getStore().get('tasks', []);
      const updated = tasks.filter((t) => t.id !== taskId);
      getStore().set('tasks', updated);

      log.info(`取消下载: ${taskId}`);
      checkAndStopPoller();
      return { success: true };
    } catch (error) {
      log.error('取消下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取所有下载任务
  ipcMain.handle('get-downloads', async () => {
    try {
      const tasks = getStore().get('tasks', []);

      // 补充 aria2 实时状态
      try {
        const active = await aria2.tellActive();
        for (const task of tasks) {
          const info = taskMap.get(task.id);
          if (!info) continue;
          const aria2Task = active.find(
            (a) => a.gid === info.gid || a.following === info.gid,
          );
          if (aria2Task) {
            task.downloadedSize = parseInt(aria2Task.completedLength || '0');
            task.totalSize = parseInt(aria2Task.totalLength || '0');
            task.speed = parseInt(aria2Task.downloadSpeed || '0');
            task.progress =
              task.totalSize > 0
                ? Math.round((task.downloadedSize / task.totalSize) * 100)
                : 0;
          }
        }
      } catch {
        // aria2 可能未启动，返回持久化数据
      }

      return tasks;
    } catch (error) {
      log.error('获取下载列表失败:', error);
      return [];
    }
  });

  // 获取全局统计（总速度、活跃数等）
  ipcMain.handle('get-download-stats', async () => {
    try {
      await aria2.start();
      const stat = await aria2.getGlobalStat();
      const tasks = getStore().get('tasks', []);
      const active = tasks.filter((t) => t.status === 'downloading').length;
      const waiting = tasks.filter((t) => t.status === 'pending').length;
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const stopped = tasks.filter((t) => ['failed', 'cancelled'].includes(t.status)).length;

      return {
        downloadSpeed: parseInt(stat.downloadSpeed || '0'),
        uploadSpeed: parseInt(stat.uploadSpeed || '0'),
        numActive: parseInt(stat.numActive || '0'),
        numWaiting: parseInt(stat.numWaiting || '0'),
        numStopped: parseInt(stat.numStopped || '0'),
        active,
        waiting,
        completed,
        stopped,
        total: tasks.length,
      };
    } catch {
      const tasks = getStore().get('tasks', []);
      return {
        downloadSpeed: 0, uploadSpeed: 0,
        numActive: 0, numWaiting: 0, numStopped: 0,
        active: tasks.filter((t) => t.status === 'downloading').length,
        waiting: tasks.filter((t) => t.status === 'pending').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        stopped: tasks.filter((t) => ['failed', 'cancelled'].includes(t.status)).length,
        total: tasks.length,
      };
    }
  });

  // 重试失败的任务
  ipcMain.handle('retry-download', async (event, taskId) => {
    try {
      const info = taskMap.get(taskId);
      if (info) {
        await aria2.remove(info.gid).catch(() => {});
        taskMap.delete(taskId);
      }

      const tasks = getStore().get('tasks', []);
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return { success: false, error: '任务不存在' };

      // 重新下载
      await aria2.start();
      const category = classifyFile(task.filename);
      const downloadBase = aria2.getDownloadDir();
      const categoryDir = path.join(downloadBase, category);
      const newGid = await aria2.addDownload(task.url, task.filename, categoryDir);

      taskMap.set(taskId, { gid: newGid, filename: task.filename, notified: false });
      task.status = 'pending';
      task.downloadedSize = 0;
      task.progress = 0;
      task.speed = 0;
      task.completedAt = null;
      getStore().set('tasks', tasks);

      startProgressPoller(event.sender);
      log.info(`重试下载: ${task.filename} → GID=${newGid}`);
      return { success: true };
    } catch (error) {
      log.error('重试下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 清除已完成的任务
  ipcMain.handle('purge-downloads', async () => {
    try {
      const tasks = getStore().get('tasks', []);
      const completed = tasks.filter((t) => t.status === 'completed');
      const remaining = tasks.filter((t) => t.status !== 'completed');

      // 清理 taskMap
      for (const t of completed) {
        taskMap.delete(t.id);
      }

      getStore().set('tasks', remaining);
      log.info(`清除 ${completed.length} 个已完成任务`);
      return { success: true, purged: completed.length };
    } catch (error) {
      log.error('清除任务失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 暂停所有下载
  ipcMain.handle('pause-all-downloads', async () => {
    try {
      for (const [taskId, info] of taskMap.entries()) {
        try { await aria2.pause(info.gid); } catch (_e) { /* ignore */ }
        updateTaskStatus(taskId, 'paused');
      }
      log.info('已暂停所有下载');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 恢复所有下载
  ipcMain.handle('resume-all-downloads', async (event) => {
    try {
      for (const [taskId, info] of taskMap.entries()) {
        const tasks = getStore().get('tasks', []);
        const task = tasks.find((t) => t.id === taskId);
        if (task && task.status === 'paused') {
          try { await aria2.unpause(info.gid); } catch (_e) { /* ignore */ }
          updateTaskStatus(taskId, 'downloading');
        }
      }
      startProgressPoller(event.sender);
      log.info('已恢复所有下载');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 删除任务（从列表移除，支持已完成/失败/已取消的任务）
  ipcMain.handle('delete-download', async (event, taskId) => {
    try {
      const info = taskMap.get(taskId);
      if (info) {
        await aria2.remove(info.gid).catch(() => {});
        taskMap.delete(taskId);
      }

      const tasks = getStore().get('tasks', []);
      const updated = tasks.filter((t) => t.id !== taskId);
      getStore().set('tasks', updated);

      log.info(`删除下载任务: ${taskId}`);
      checkAndStopPoller();
      return { success: true };
    } catch (error) {
      log.error('删除任务失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 添加 BT/Magnet 下载
  ipcMain.handle('add-bt-download', async (event, torrentBase64, _savePath) => {
    try {
      await aria2.start();

      const taskId = uuidv4();
      const downloadBase = aria2.getDownloadDir();
      const aria2Gid = await aria2.addTorrent(torrentBase64, downloadBase);

      const task = {
        id: taskId,
        url: 'BT 下载',
        savePath: downloadBase,
        filename: 'BT 任务',
        totalSize: 0,
        downloadedSize: 0,
        progress: 0,
        speed: 0,
        status: 'pending',
        createdAt: Date.now(),
        completedAt: null,
        source: 'bt',
      };

      taskMap.set(taskId, { gid: aria2Gid, filename: 'BT 任务', notified: false });

      const tasks = getStore().get('tasks', []);
      tasks.push(task);
      getStore().set('tasks', tasks);

      startProgressPoller(event.sender);

      log.info(`添加 BT 下载: GID=${aria2Gid}`);
      return task;
    } catch (error) {
      log.error('添加 BT 下载失败:', error);
      return { error: error.message };
    }
  });

  // 设置全局速度限制
  ipcMain.handle('set-speed-limit', async (event, { downloadSpeed, uploadSpeed }) => {
    try {
      await aria2.start();
      if (downloadSpeed !== undefined) {
        await aria2.setOption('global-option', 'max-overall-download-limit',
          downloadSpeed > 0 ? `${downloadSpeed}K` : '0');
      }
      if (uploadSpeed !== undefined) {
        await aria2.setOption('global-option', 'max-overall-upload-limit',
          uploadSpeed > 0 ? `${uploadSpeed}K` : '0');
      }
      log.info(`速度限制: ↓${downloadSpeed || 0}KB/s ↑${uploadSpeed || 0}KB/s`);
      return { success: true };
    } catch (error) {
      log.error('设置速度限制失败:', error);
      return { success: false, error: error.message };
    }
  });
}

// 批量 store 写入：攒 500ms 再一次性写入，避免每秒全量读写
let dirtyTimer = null;
function markDirty() {
  if (dirtyTimer) return;
  dirtyTimer = setTimeout(() => {
    dirtyTimer = null;
    const tasks = getStore().get('tasks', []);
    // 将内存中 taskMap 的实时状态同步到 store
    for (const [taskId, info] of taskMap.entries()) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && info._pendingFields) {
        Object.assign(task, info._pendingFields);
        info._pendingFields = null;
      }
    }
    getStore().set('tasks', tasks);
  }, 500);
}

function updateTaskStatus(taskId, status) {
  const tasks = getStore().get('tasks', []);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
    getStore().set('tasks', tasks);
  }
}

function updateTaskField(taskId, field, value) {
  const info = taskMap.get(taskId);
  if (!info) return;
  if (!info._pendingFields) info._pendingFields = {};
  info._pendingFields[field] = value;
  markDirty();
}

module.exports = { registerDownloadHandlers, addBrowserDownload };
