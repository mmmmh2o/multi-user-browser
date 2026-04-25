const { ipcMain } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const log = require('electron-log');

// 允许访问的根目录（路径遍历防护）
const ALLOWED_ROOT = os.homedir();

/**
 * 验证路径合法性，防止路径遍历攻击
 */
function validatePath(targetPath) {
  const resolved = path.resolve(targetPath);
  if (!resolved.startsWith(ALLOWED_ROOT)) {
    throw new Error(`路径越界: ${targetPath} 不在允许的范围内`);
  }
  return resolved;
}

/**
 * 文件管理 IPC Handler
 */
function registerFileHandlers() {
  // 获取文件列表
  ipcMain.handle('get-files', async (event, dirPath) => {
    try {
      const safePath = validatePath(dirPath);
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(safePath, entry.name);
          const stat = await fs.stat(fullPath);
          return {
            name: entry.name,
            path: fullPath,
            size: stat.size,
            isDirectory: entry.isDirectory(),
            extension: path.extname(entry.name),
            modifiedAt: stat.mtimeMs,
          };
        }),
      );
      log.debug(`读取目录: ${safePath} (${files.length} 项)`);
      return files;
    } catch (error) {
      log.error('读取目录失败:', error);
      return { error: error.message };
    }
  });

  // 创建文件
  ipcMain.handle('create-file', async (event, filePath, content = '') => {
    try {
      const safePath = validatePath(filePath);
      await fs.ensureDir(path.dirname(safePath));
      await fs.writeFile(safePath, content, 'utf-8');
      log.info(`创建文件: ${safePath}`);
      return { success: true };
    } catch (error) {
      log.error('创建文件失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 创建目录
  ipcMain.handle('create-directory', async (event, dirPath) => {
    try {
      const safePath = validatePath(dirPath);
      await fs.ensureDir(safePath);
      log.info(`创建目录: ${safePath}`);
      return { success: true };
    } catch (error) {
      log.error('创建目录失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 删除文件/目录
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      const safePath = validatePath(filePath);
      const exists = await fs.pathExists(safePath);
      if (!exists) {
        return { success: false, error: '文件不存在' };
      }
      await fs.remove(safePath);
      log.info(`删除: ${safePath}`);
      return { success: true };
    } catch (error) {
      log.error('删除失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 重命名
  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    try {
      const safeOld = validatePath(oldPath);
      const safeNew = validatePath(newPath);
      await fs.rename(safeOld, safeNew);
      log.info(`重命名: ${safeOld} → ${safeNew}`);
      return { success: true };
    } catch (error) {
      log.error('重命名失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 复制
  ipcMain.handle('copy-file', async (event, sourcePath, destPath) => {
    try {
      const safeSource = validatePath(sourcePath);
      const safeDest = validatePath(destPath);
      await fs.copy(safeSource, safeDest);
      log.info(`复制: ${safeSource} → ${safeDest}`);
      return { success: true };
    } catch (error) {
      log.error('复制失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 移动
  ipcMain.handle('move-file', async (event, sourcePath, destPath) => {
    try {
      const safeSource = validatePath(sourcePath);
      const safeDest = validatePath(destPath);
      await fs.move(safeSource, safeDest);
      log.info(`移动: ${safeSource} → ${safeDest}`);
      return { success: true };
    } catch (error) {
      log.error('移动失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 读取文件
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const safePath = validatePath(filePath);
      const content = await fs.readFile(safePath, 'utf-8');
      log.debug(`读取文件: ${safePath}`);
      return { success: true, content };
    } catch (error) {
      log.error('读取文件失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 写入文件
  ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
      const safePath = validatePath(filePath);
      await fs.writeFile(safePath, content, 'utf-8');
      log.info(`写入文件: ${safePath}`);
      return { success: true };
    } catch (error) {
      log.error('写入文件失败:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerFileHandlers, validatePath };
