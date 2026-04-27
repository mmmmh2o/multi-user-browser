const path = require('path');
const os = require('os');

/**
 * 路径遍历防护工具
 * 验证目标路径是否在允许的根目录内
 */

const ALLOWED_ROOT = os.homedir();

/**
 * 验证路径合法性
 * @param {string} targetPath - 要验证的路径
 * @returns {string} 解析后的安全路径
 * @throws {Error} 路径越界时抛出异常
 */
function validatePath(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') {
    throw new Error('无效的路径参数');
  }

  // 解析为绝对路径
  const resolved = path.resolve(targetPath);

  // 检查是否在允许的根目录内
  if (!resolved.startsWith(ALLOWED_ROOT)) {
    throw new Error(`路径越界: ${targetPath} 不在允许的范围内 (${ALLOWED_ROOT})`);
  }

  // 检查路径遍历攻击
  const normalized = path.normalize(targetPath);
  if (normalized.includes('..')) {
    throw new Error(`路径遍历检测: ${targetPath} 包含非法的父目录引用`);
  }

  return resolved;
}

/**
 * 获取允许的根目录
 */
function getAllowedRoot() {
  return ALLOWED_ROOT;
}

module.exports = { validatePath, getAllowedRoot };
