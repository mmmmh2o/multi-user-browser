import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.less';

/**
 * 主题包装器
 * 读取设置中的 darkMode，动态切换 Ant Design 主题
 */
function ThemedApp() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    window.electronAPI?.getSettings?.().then((s) => {
      if (s?.darkMode) setDarkMode(true);
    }).catch(() => {});

    const handleSettingsChange = (e) => {
      if (e.detail?.darkMode !== undefined) {
        setDarkMode(e.detail.darkMode);
      }
    };
    window.addEventListener('mub-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('mub-settings-changed', handleSettingsChange);
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: { colorPrimary: '#4f6ef7' },
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemedApp />
  </React.StrictMode>
);
