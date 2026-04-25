const { ipcMain } = require('electron');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');

const store = new Store({ name: 'downloads' });

// 活跃的下载任务
const activeDownloads = new Map();

/**
 * 文件自动分类
 */
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

/**
 * 下载管理 IPC Handler
 */
function registerDownloadHandlers() {
  // 添加下载任务
  ipcMain.handle('add-download', async (event, url, savePath) => {
    try {
      const taskId = uuidv4();
      const fileName = path.basename(new URL(url).pathname) || `download_${taskId}`;
      const category = classifyFile(fileName);
      const finalDir = path.join(savePath, category);
      const finalPath = path.join(finalDir, fileName);

      // 确保目录存在
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
      }

      const task = {
        id: taskId,
        url,
        savePath: finalPath,
        filename: fileName,
        totalSize: 0,
        downloadedSize: 0,
        progress: 0,
        status: 'pending',
        createdAt: Date.now(),
        completedAt: null,
      };

      // 保存任务
      const tasks = store.get('tasks', []);
      tasks.push(task);
      store.set('tasks', tasks);

      // 开始下载
      startDownload(taskId, url, finalPath, event.sender);

      log.info(`添加下载: ${fileName} → ${finalPath}`);
      return task;
    } catch (error) {
      log.error('添加下载失败:', error);
      return { error: error.message };
    }
  });

  // 暂停下载
  ipcMain.handle('pause-download', async (event, taskId) => {
    try {
      const download = activeDownloads.get(taskId);
      if (download) {
        download.paused = true;
        download.request.destroy();
        updateTaskStatus(taskId, 'paused');
        log.info(`暂停下载: ${taskId}`);
        return { success: true };
      }
      return { success: false, error: '任务不存在或未在下载中' };
    } catch (error) {
      log.error('暂停下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 恢复下载
  ipcMain.handle('resume-download', async (event, taskId) => {
    try {
      const tasks = store.get('tasks', []);
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        startDownload(taskId, task.url, task.savePath, event.sender, task.downloadedSize);
        updateTaskStatus(taskId, 'downloading');
        log.info(`恢复下载: ${taskId}`);
        return { success: true };
      }
      return { success: false, error: '任务不存在' };
    } catch (error) {
      log.error('恢复下载失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 取消下载
  ipcMain.handle('cancel-download', async (event, taskId) => {
    try {
      const download = activeDownloads.get(taskId);
      if (download) {
        download.request.destroy();
        activeDownloads.delete(taskId);
      }
      // 删除部分下载的文件
      const tasks = store.get('tasks', []);
      const task = tasks.find((t) => t.id === taskId);
      if (task && fs.existsSync(task.savePath)) {
        fs.unlinkSync(task.savePath);
      }
      // 从任务列表移除
      const updated = tasks.filter((t) => t.id !== taskId);
      store.set('tasks', updated);
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
      return store.get('tasks', []);
    } catch (error) {
      log.error('获取下载列表失败:', error);
      return [];
    }
  });
}

/**
 * 开始下载
 */
function startDownload(taskId, url, savePath, webContents, startByte = 0) {
  const protocol = url.startsWith('https') ? https : http;
  const options = {};

  if (startByte > 0) {
    options.headers = { Range: `bytes=${startByte}-` };
  }

  const request = protocol.get(url, options, (response) => {
    // 处理重定向
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      startDownload(taskId, response.headers.location, savePath, webContents, startByte);
      return;
    }

    if (response.statusCode !== 200 && response.statusCode !== 206) {
      updateTaskStatus(taskId, 'failed');
      log.error(`下载失败: HTTP ${response.statusCode}`);
      return;
    }

    const fileSize = parseInt(response.headers['content-length'] || '0') + startByte;
    const fileStream = fs.createWriteStream(savePath, { flags: startByte > 0 ? 'a' : 'w' });

    updateTaskField(taskId, "totalSize", fileSize);
    updateTaskStatus(taskId, 'downloading');

    let downloadedSize = startByte;

    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      fileStream.write(chunk);

      // 更新进度
      const progress = fileSize > 0 ? Math.round((downloadedSize / fileSize) * 100) : 0;
      updateTaskField(taskId, 'downloadedSize', downloadedSize);

      // 推送进度到渲染进程
      if (webContents && !webContents.isDestroyed()) {
        webContents.send('download-progress', {
          id: taskId,
          downloadedSize,
          totalSize: fileSize,
          progress,
        });
      }
    });

    response.on('end', () => {
      fileStream.end();
      updateTaskStatus(taskId, 'completed');
      updateTaskField(taskId, 'completedAt', Date.now());
      activeDownloads.delete(taskId);

      // 推送完成通知
      if (webContents && !webContents.isDestroyed()) {
        webContents.send('download-completed', { id: taskId, filename: path.basename(savePath), path: savePath });
      }
      log.info(`下载完成: ${taskId}`);
    });

    response.on('error', (error) => {
      fileStream.end();
      updateTaskStatus(taskId, 'failed');
      activeDownloads.delete(taskId);
      log.error(`下载错误: ${taskId}`, error);
    });

    // 保存活跃下载引用
    activeDownloads.set(taskId, { request, paused: false });
  });

  request.on('error', (error) => {
    updateTaskStatus(taskId, 'failed');
    activeDownloads.delete(taskId);
    log.error(`下载请求错误: ${taskId}`, error);
  });
}

function updateTaskStatus(taskId, status) {
  const tasks = store.get('tasks', []);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.status = status;
    store.set('tasks', tasks);
  }
}

function updateTaskField(taskId, field, value) {
  const tasks = store.get('tasks', []);
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task[field] = value;
    store.set('tasks', tasks);
  }
}

module.exports = { registerDownloadHandlers };
