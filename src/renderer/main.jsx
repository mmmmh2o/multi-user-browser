import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import store from './store';
import './styles/global.less';

/**
 * 主题包装器
 * 读取设置中的 darkMode，动态切换 Ant Design 主题 + CSS 变量主题
 */
function ThemedApp() {
  const [darkMode, setDarkMode] = useState(false);

  // 同步 data-theme 属性到 HTML 根元素
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    // 初始加载
    window.electronAPI?.getSettings?.().then((s) => {
      if (s?.darkMode) {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    }).catch(() => {});

    // 监听设置变化
    const handleSettingsChange = (e) => {
      if (e.detail?.darkMode !== undefined) {
        setDarkMode(e.detail.darkMode);
        document.documentElement.setAttribute('data-theme', e.detail.darkMode ? 'dark' : 'light');
      }
    };
    window.addEventListener('mub-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('mub-settings-changed', handleSettingsChange);
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4f6ef7',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', \'PingFang SC\', \'Hiragino Sans GB\', \'Microsoft YaHei\', \'Noto Sans SC\', sans-serif',
        },
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemedApp />
    </Provider>
  </React.StrictMode>,
);
