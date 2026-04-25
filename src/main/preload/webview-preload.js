/**
 * Webview Preload 脚本
 *
 * 在每个 webview 页面加载前执行，负责：
 * 1. 从主进程获取当前用户的已启用脚本
 * 2. 注入 UserScript 到页面
 * 3. 提供 GM_* 风格的 API 桥接
 */

const { ipcRenderer } = require('electron');

/**
 * 解析 UserScript 头部元数据
 * @param {string} code - 脚本代码
 * @returns {object} 元数据
 */
function parseUserScriptMeta(code) {
  const meta = {};
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
 */
function matchesPage(meta, url) {
  if (!meta.match && !meta.include) return true; // 没有匹配规则 → 全局注入

  const patterns = [].concat(meta.match || [], meta.include || []);
  return patterns.some((pattern) => {
    // 简化版匹配：* 通配符转正则
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(url);
  });
}

/**
 * 注入单个脚本到页面
 */
function injectScript(code, meta) {
  // 去掉 UserScript 头部，保留实际代码
  const cleanCode = code.replace(/==UserScript==[\s\S]*?==\/UserScript==/, '').trim();
  if (!cleanCode) return;

  try {
    const script = document.createElement('script');
    script.textContent = cleanCode;
    script.setAttribute('data-userscript', meta.name || 'unknown');
    (document.head || document.documentElement).appendChild(script);
    script.remove(); // 执行后移除标签（代码已运行）
    console.log(`[MUB] 已注入脚本: ${meta.name || 'unnamed'}`);
  } catch (err) {
    console.error(`[MUB] 脚本注入失败: ${meta.name}`, err);
  }
}

/**
 * GM_* API 实现
 * 提供 Tampermonkey 兼容的存储 API
 */
function createGMApi(scriptId) {
  const storageKey = `gm_storage_${scriptId}`;

  return {
    GM_getValue: (key, defaultValue) => {
      try {
        const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        return store[key] !== undefined ? store[key] : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    GM_setValue: (key, value) => {
      try {
        const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        store[key] = value;
        localStorage.setItem(storageKey, JSON.stringify(store));
      } catch (e) {
        console.error('[MUB] GM_setValue 失败:', e);
      }
    },
    GM_deleteValue: (key) => {
      try {
        const store = JSON.parse(localStorage.getItem(storageKey) || '{}');
        delete store[key];
        localStorage.setItem(storageKey, JSON.stringify(store));
      } catch {}
    },
    GM_listValues: () => {
      try {
        return Object.keys(JSON.parse(localStorage.getItem(storageKey) || '{}'));
      } catch {
        return [];
      }
    },
    GM_log: (...args) => {
      console.log(`[UserScript:${scriptId}]`, ...args);
    },
    GM_xmlhttpRequest: (details) => {
      // 通过 IPC 桥接实现跨域请求
      // 简化版：仅支持 GET
      fetch(details.url, {
        method: details.method || 'GET',
        headers: details.headers,
      })
        .then((r) => r.text())
        .then((text) => details.onload?.({ responseText: text, status: 200 }))
        .catch((err) => details.onerror?.(err));
    },
    GM_addStyle: (css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    },
  };
}

/**
 * 主入口
 */
async function main() {
  const currentUrl = window.location.href;

  // 跳过特殊页面
  if (
    currentUrl.startsWith('about:') ||
    currentUrl.startsWith('chrome:') ||
    currentUrl.startsWith('devtools:')
  ) {
    return;
  }

  try {
    // 从主进程获取已启用的脚本
    const scripts = await ipcRenderer.invoke('get-enabled-scripts');

    if (!scripts || scripts.length === 0) return;

    for (const script of scripts) {
      if (!script.code) continue;

      const meta = parseUserScriptMeta(script.code);

      // 检查是否匹配当前页面
      if (!matchesPage(meta, currentUrl)) continue;

      // 注入 GM API
      const gmApi = createGMApi(script.id);
      for (const [key, value] of Object.entries(gmApi)) {
        window[key] = value;
      }

      // 注入脚本
      injectScript(script.code, meta);
    }
  } catch (err) {
    console.error('[MUB] 脚本加载失败:', err);
  }
}

// DOM 就绪后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
