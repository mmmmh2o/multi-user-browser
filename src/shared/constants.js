/**
 * 共享常量 - 主进程和渲染进程共用
 */

// 文件分类映射（与 fileClassifier.js 保持同步）
const FILE_CATEGORIES = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff'],
  videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'],
  archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
  code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.go', '.rs'],
};

// 下载任务状态
const DOWNLOAD_STATUS = {
  PENDING: 'pending',
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// 历史记录最大条数
const MAX_HISTORY = 100;

// 应用信息
const APP_INFO = {
  name: 'Multi-User Browser',
  version: '0.1.0',
  description: '多用户并发管理浏览器',
};

module.exports = {
  FILE_CATEGORIES,
  DOWNLOAD_STATUS,
  MAX_HISTORY,
  APP_INFO,
};
