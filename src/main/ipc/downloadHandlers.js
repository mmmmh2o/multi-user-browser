const { ipcMain } = require('electron');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const log = require('electron-log');
const aria2 = require('../utils/aria2Manager');

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

function classifyFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const categories = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'],
    videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
  };
  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
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

function registerDownloadHandlers() {
  // 添加下载任务
  ipcMain.handle('add-download', async (event, url, savePath) => {
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
            (a) => a.gid === info.gid || a.following === info.gid
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
  const tasks = getStore().get('tasks', []);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task[field] = value;
    getStore().set('tasks', tasks);
  }
}

module.exports = { registerDownloadHandlers };
