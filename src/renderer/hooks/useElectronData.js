import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { safeCall } from '../utils/ipcHelper';

/**
 * 通用 Electron 数据加载 Hook
 * 封装 useState + useEffect + safeCall 的重复模式
 *
 * @param {string} apiMethod - window.electronAPI 上的方法名
 * @param {Array} fallback - 失败时的默认值
 * @returns {{ data, loading, reload, setData }}
 */
export function useElectronData(apiMethod, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await safeCall(
        () => window.electronAPI[apiMethod](),
        fallback,
      );
      setData(result || fallback);
    } catch {
      message.error('加载失败');
      setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [apiMethod]);

  useEffect(() => {
    reload();
  }, []);

  return { data, loading, reload, setData };
}
