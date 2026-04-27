/**
 * Webview Preload 脚本
 *
 * 在每个 webview 页面加载前执行，负责：
 * 1. 从主进程获取当前用户的已启用脚本
 * 2. 注入 UserScript 到页面
 * 3. 提供 GM_* 风格的 API 桥接
 * 4. 拦截 target=_blank 链接和 window.open()，转为新标签页
 */

const { ipcRenderer } = require('electron');
const { parseUserScriptMeta, matchesPage, extractCode } = require('../utils/userScriptParser');

// ========== 新标签页拦截 ==========
// 拦截 target=_blank 链接点击，通过 IPC 通知主进程在新标签页打开
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (link && link.target === '_blank') {
    e.preventDefault();
    const url = link.href;
    if (url && !url.startsWith('javascript:')) {
      ipcRenderer.send('open-url-in-tab', url);
    }
  }
}, true);

// 拦截 window.open() 调用
const originalWindowOpen = window.open;
window.open = function(url, target, features) {
  // UserScript 的 GM_openInTab 等可能调用 window.open
  // 如果 target 不是 _self 且不是当前窗口，转为新标签页
  if (url && target !== '_self' && target !== '_top' && target !== '_parent') {
    ipcRenderer.send('open-url-in-tab', url);
    return null;
  }
  // 其他情况（如 UserScript 需要在当前窗口打开）走原始逻辑
  return originalWindowOpen.call(window, url, target, features);
};

/**
 * 注入单个脚本到页面
 */
function injectScript(code, meta) {
  const cleanCode = extractCode(code);
  if (!cleanCode) return;

  try {
    const script = document.createElement('script');
    script.textContent = cleanCode;
    script.setAttribute('data-userscript', meta.name || 'unknown');
    (document.head || document.documentElement).appendChild(script);
    script.remove();
    console.log(`[MUB] 已注入脚本: ${meta.name || 'unnamed'}`);
  } catch (err) {
    console.error(`[MUB] 脚本注入失败: ${meta.name}`, err);
  }
}

/**
 * GM_* API 实现
 * 提供 Tampermonkey 兼容的 API
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
      } catch {
        // localStorage 不可用时静默忽略
      }
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
    /**
     * 跨域请求 — 通过主进程 net 模块代理
     * 不受同源策略限制，支持 GET/POST 等所有方法
     */
    GM_xmlhttpRequest: (details) => {
      const fetchOptions = {
        method: details.method || 'GET',
        url: details.url,
        headers: details.headers || {},
        timeout: details.timeout || 30000,
      };

      // Tampermonkey 兼容：data 或 body 都作为请求体
      if (details.data || details.body) {
        fetchOptions.body = details.data || details.body;
      }

      // 自动设 Content-Type
      if (fetchOptions.body && !fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
        fetchOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      // 通过 IPC 调用主进程 net 模块，绕过 CORS
      ipcRenderer.invoke('proxy-net-request', fetchOptions)
        .then((result) => {
          if (result.error) {
            details.onerror?.(result.error);
          } else {
            details.onload?.({
              responseText: result.responseText,
              response: result.responseText,
              status: result.status,
              statusText: result.statusText,
              readyState: result.readyState,
              responseHeaders: result.responseHeaders,
            });
          }
        })
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
    const scripts = await ipcRenderer.invoke('get-enabled-scripts');
    if (!scripts || scripts.length === 0) return;

    for (const script of scripts) {
      if (!script.code) continue;

      const meta = parseUserScriptMeta(script.code);
      if (!matchesPage(meta, currentUrl)) continue;

      // 注入 GM API
      const gmApi = createGMApi(script.id);
      for (const [key, value] of Object.entries(gmApi)) {
        window[key] = value;
      }

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
