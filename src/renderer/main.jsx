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
 * 读取设置中的 darkMode，动态切换 Ant Design 主题
 */
function ThemedApp() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 初始加载
    window.electronAPI?.getSettings?.().then((s) => {
      if (s?.darkMode) setDarkMode(true);
    }).catch(() => {});

    // 监听设置变化（通过 storage 事件或自定义事件）
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
        token: { colorPrimary: '#1677ff' },
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
  </React.StrictMode>
);
