const path = require('path');

/**
 * 文件自动分类工具
 * 根据文件扩展名自动分类到对应目录
 */

const CATEGORY_MAP = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff'],
  videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
  code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs'],
};

/**
 * 根据文件名判断分类
 * @param {string} fileName - 文件名
 * @returns {string} 分类名称
 */
function classifyFile(fileName) {
  if (!fileName) return 'other';

  const ext = path.extname(fileName).toLowerCase();

  for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'other';
}

/**
 * 获取分类对应的目录路径
 * @param {string} fileName - 文件名
 * @param {string} baseDir - 基础目录
 * @returns {string} 分类后的完整路径
 */
function getClassifiedPath(fileName, baseDir) {
  const category = classifyFile(fileName);
  return path.join(baseDir, category, fileName);
}

/**
 * 获取所有分类
 */
function getCategories() {
  return Object.keys(CATEGORY_MAP);
}

module.exports = { classifyFile, getClassifiedPath, getCategories, CATEGORY_MAP };
