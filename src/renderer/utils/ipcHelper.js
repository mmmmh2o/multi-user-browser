/**
 * IPC 调用超时兜底
 * 防止主进程 handler 未注册时 IPC 调用永远挂起
 */

const IPC_TIMEOUT = 5000; // 5秒超时

/**
 * 带超时的 IPC 调用
 * @param {Function} apiFn - window.electronAPI 上的方法
 * @param {any} fallback - 超时/失败时的返回值
 * @param {number} timeout - 超时时间 ms
 * @returns {Promise<any>}
 */
export async function safeCall(apiFn, fallback = null, timeout = IPC_TIMEOUT) {
  if (!apiFn) return fallback;

  return Promise.race([
    apiFn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('IPC 调用超时')), timeout)
    ),
  ]).catch((err) => {
    console.error('[IPC] 调用失败:', err.message);
    return fallback;
  });
}
