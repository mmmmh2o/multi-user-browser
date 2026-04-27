/**
 * IPC 调用超时兜底
 * 防止主进程 handler 未注册时 IPC 调用永远挂起
 */

const IPC_TIMEOUT = 5000; // 5秒超时

/**
 * 带超时的 IPC 调用
 *
 * 关键：apiFn 必须在 Promise executor 内调用，
 * 否则同步 throw 会穿透 .catch()。
 *
 * @param {Function} apiFn - window.electronAPI 上的方法（或返回 Promise 的箭头函数）
 * @param {any} fallback - 超时/失败时的返回值
 * @param {number} timeout - 超时时间 ms
 * @returns {Promise<any>}
 */
export async function safeCall(apiFn, fallback = null, timeout = IPC_TIMEOUT) {
  if (!apiFn) return fallback;

  // 用 new Promise 包裹 apiFn 调用，确保同步 throw 也被转为 rejection
  const callPromise = new Promise((resolve, reject) => {
    try {
      const result = apiFn();
      // apiFn 可能返回 Promise，也可能返回普通值
      Promise.resolve(result).then(resolve, reject);
    } catch (err) {
      // 同步 throw（如 window.electronAPI 不存在）
      reject(err);
    }
  });

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('IPC 调用超时')), timeout),
  );

  return Promise.race([callPromise, timeoutPromise]).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[IPC] 调用失败:', err.message);
    return fallback;
  });
}
