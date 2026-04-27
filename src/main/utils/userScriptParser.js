/**
 * UserScript 解析工具
 * 从 webview-preload.js 提取，供测试和复用
 */

/**
 * 解析 UserScript 头部元数据
 * @param {string} code - 脚本代码
 * @returns {object} 元数据 { name, match, include, ... }
 */
function parseUserScriptMeta(code) {
  const meta = {};
  if (!code) return meta;

  const headerMatch = code.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
  if (!headerMatch) return meta;

  const lines = headerMatch[1].split('\n');
  for (const line of lines) {
    const m = line.match(/@(\w+)\s+(.*)/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      if (meta[key]) {
        if (!Array.isArray(meta[key])) meta[key] = [meta[key]];
        meta[key].push(value);
      } else {
        meta[key] = value;
      }
    }
  }
  return meta;
}

/**
 * 检查脚本是否匹配当前页面
 * @param {object} meta - parseUserScriptMeta 返回的元数据
 * @param {string} url - 当前页面 URL
 * @returns {boolean}
 */
function matchesPage(meta, url) {
  if (!meta.match && !meta.include) return true;

  const patterns = [].concat(meta.match || [], meta.include || []);
  return patterns.some((pattern) => {
    const escaped = pattern
      .replace(/([.+?^${}()|[\]\\])/g, '\\$1')
      .replace(/\*/g, '.*')
      .replace(/\\\?/g, '.');
    const regex = new RegExp('^' + escaped + '$');
    return regex.test(url);
  });
}

/**
 * 去掉 UserScript 头部，返回纯代码
 * @param {string} code - 完整脚本代码
 * @returns {string}
 */
function extractCode(code) {
  if (!code) return '';
  // 去掉整个 UserScript 头部块（包括行首的 // 前缀）
  return code
    .replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/, '')
    .replace(/^\s*\n/, '')
    .trim();
}

module.exports = { parseUserScriptMeta, matchesPage, extractCode };
