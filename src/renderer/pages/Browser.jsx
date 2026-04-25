import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  Input,
  Space,
  Tabs,
  Dropdown,
  Spin,
  Tooltip,
  Empty,
  message,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  CloseOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  LockOutlined,
  GlobalOutlined,
  StarOutlined,
  StarFilled,
  MoreOutlined,
  CloseCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const HOME_URL = 'about:blank';
const NEW_TAB_URL = 'about:blank';

/**
 * 浏览器页面 — 真实 webview 实现
 *
 * 核心功能：
 * - 多标签页，每个标签一个 webview
 * - 用户会话隔离（partition）
 * - 导航控制（前进/后退/刷新）
 * - 地址栏 + URL 显示
 * - 书签收藏
 * - 加载状态指示
 * - 右键菜单（关闭其他/关闭全部）
 */
export default function Browser() {
  const [tabs, setTabs] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState(null);
  const [address, setAddress] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const webviewRefs = useRef({});

  // ========== 初始化 ==========
  useEffect(() => {
    loadCurrentUser();
    addNewTab();

    // 监听来自书签/历史页面的导航事件
    const handleNavigateEvent = (e) => {
      const { url } = e.detail || {};
      if (url) {
        addNewTab(url);
      }
    };
    window.addEventListener('mub-navigate', handleNavigateEvent);
    return () => window.removeEventListener('mub-navigate', handleNavigateEvent);
  }, []);

  const loadCurrentUser = async () => {
    try {
      const users = await window.electronAPI.getUsers();
      const active = users.find((u) => u.isActive) || users[0] || null;
      setCurrentUser(active);
    } catch (e) {
      console.error('加载用户失败:', e);
    }
  };

  // ========== 标签页管理 ==========
  const addNewTab = useCallback((url = NEW_TAB_URL) => {
    const key = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTab = {
      key,
      title: '新标签页',
      url,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      favicon: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabKey(key);
    setAddress(url === NEW_TAB_URL ? '' : url);
    return key;
  }, []);

  const closeTab = useCallback(
    (targetKey) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.key === targetKey);
        if (idx === -1) return prev;

        const next = prev.filter((t) => t.key !== targetKey);

        if (activeTabKey === targetKey) {
          if (next.length === 0) {
            // 关闭最后一个标签 → 新建一个
            setTimeout(() => addNewTab(), 0);
            return next;
          }
          const newIdx = Math.min(idx, next.length - 1);
          setActiveTabKey(next[newIdx].key);
          setAddress(next[newIdx].url === NEW_TAB_URL ? '' : next[newIdx].url);
        }

        return next;
      });

      // 清理 webview 引用
      delete webviewRefs.current[targetKey];
    },
    [activeTabKey, addNewTab]
  );

  const switchTab = useCallback(
    (key) => {
      setActiveTabKey(key);
      const tab = tabs.find((t) => t.key === key);
      if (tab) {
        setAddress(tab.url === NEW_TAB_URL ? '' : tab.url);
      }
    },
    [tabs]
  );

  // ========== webview 分区（用户隔离） ==========
  const getPartition = useCallback(() => {
    if (currentUser?.id) {
      return `persist:user-${currentUser.id}`;
    }
    return 'persist:default';
  }, [currentUser]);

  // ========== 导航操作 ==========
  const getActiveWebview = useCallback(() => {
    if (!activeTabKey) return null;
    return webviewRefs.current[activeTabKey];
  }, [activeTabKey]);

  const handleNavigate = useCallback(
    (input) => {
      if (!input.trim()) return;

      let url = input.trim();

      // 判断是否为 URL
      if (url === 'about:blank') {
        // ok
      } else if (/^https?:\/\//i.test(url)) {
        // 完整 URL
      } else if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(url)) {
        // 域名形式 → 加 https
        url = `https://${url}`;
      } else {
        // 当搜索词处理
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }

      const wv = getActiveWebview();
      if (wv) {
        wv.loadURL(url);
      }

      // 更新 tab URL
      setTabs((prev) =>
        prev.map((t) =>
          t.key === activeTabKey ? { ...t, url, isLoading: true } : t
        )
      );
      setAddress(url);
    },
    [activeTabKey, getActiveWebview]
  );

  const handleGoBack = useCallback(() => {
    const wv = getActiveWebview();
    if (wv?.canGoBack()) wv.goBack();
  }, [getActiveWebview]);

  const handleGoForward = useCallback(() => {
    const wv = getActiveWebview();
    if (wv?.canGoForward()) wv.goForward();
  }, [getActiveWebview]);

  const handleReload = useCallback(() => {
    const wv = getActiveWebview();
    if (wv) wv.reload();
  }, [getActiveWebview]);

  const handleStop = useCallback(() => {
    const wv = getActiveWebview();
    if (wv) wv.stop();
  }, [getActiveWebview]);

  const handleGoHome = useCallback(() => {
    handleNavigate('about:blank');
  }, [handleNavigate]);

  // ========== 书签 ==========
  const handleBookmark = useCallback(async () => {
    const tab = tabs.find((t) => t.key === activeTabKey);
    if (!tab || tab.url === NEW_TAB_URL || tab.url === 'about:blank') {
      message.warning('无法收藏空白页');
      return;
    }
    try {
      await window.electronAPI.saveBookmark({
        userId: currentUser?.id,
        title: tab.title,
        url: tab.url,
        favicon: tab.favicon,
      });
      message.success('已添加书签');
    } catch (e) {
      message.error('收藏失败');
    }
  }, [tabs, activeTabKey, currentUser]);

  // ========== webview 事件处理 ==========
  const handleWebviewEvents = useCallback(
    (key, webview) => {
      if (!webview) return;

      webview.addEventListener('did-start-loading', () => {
        setTabs((prev) =>
          prev.map((t) => (t.key === key ? { ...t, isLoading: true } : t))
        );
      });

      webview.addEventListener('did-stop-loading', () => {
        setTabs((prev) =>
          prev.map((t) => (t.key === key ? { ...t, isLoading: false } : t))
        );
      });

      webview.addEventListener('page-title-updated', (e) => {
        setTabs((prev) =>
          prev.map((t) =>
            t.key === key ? { ...t, title: e.title || '无标题' } : t
          )
        );
      });

      webview.addEventListener('page-favicon-updated', (e) => {
        if (e.favicons?.length > 0) {
          setTabs((prev) =>
            prev.map((t) =>
              t.key === key ? { ...t, favicon: e.favicons[0] } : t
            )
          );
        }
      });

      webview.addEventListener('did-navigate', (e) => {
        setTabs((prev) =>
          prev.map((t) =>
            t.key === key
              ? {
                  ...t,
                  url: e.url,
                  canGoBack: webview.canGoBack(),
                  canGoForward: webview.canGoForward(),
                }
              : t
          )
        );
        if (key === activeTabKey) {
          setAddress(e.url);
        }
      });

      webview.addEventListener('did-navigate-in-page', (e) => {
        if (e.isMainFrame) {
          setTabs((prev) =>
            prev.map((t) =>
              t.key === key
                ? {
                    ...t,
                    url: e.url,
                    canGoBack: webview.canGoBack(),
                    canGoForward: webview.canGoForward(),
                  }
                : t
            )
          );
          if (key === activeTabKey) {
            setAddress(e.url);
          }
        }
      });

      webview.addEventListener('new-window', (e) => {
        // 在新标签中打开
        e.preventDefault();
        addNewTab(e.url);
      });

      webview.addEventListener('did-fail-load', (e) => {
        if (e.errorCode !== -3) {
          // -3 = aborted, 忽略
          setTabs((prev) =>
            prev.map((t) =>
              t.key === key ? { ...t, isLoading: false } : t
            )
          );
          message.error(`加载失败: ${e.errorDescription}`);
        }
      });

      // 保存引用
      webviewRefs.current[key] = webview;
    },
    [activeTabKey, addNewTab]
  );

  // ========== 地址栏快捷键 ==========
  const handleAddressKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleNavigate(address);
      }
      if (e.key === 'Escape') {
        // 恢复当前 tab 的 URL
        const tab = tabs.find((t) => t.key === activeTabKey);
        if (tab) setAddress(tab.url === NEW_TAB_URL ? '' : tab.url);
      }
    },
    [address, handleNavigate, tabs, activeTabKey]
  );

  // ========== 右键菜单 ==========
  const getTabMenuItems = useCallback(
    (key) => [
      {
        key: 'close-others',
        label: '关闭其他标签',
        icon: <CloseCircleOutlined />,
        onClick: () => {
          setTabs((prev) => prev.filter((t) => t.key === key));
          setActiveTabKey(key);
        },
      },
      {
        key: 'close-right',
        label: '关闭右侧标签',
        onClick: () => {
          setTabs((prev) => {
            const idx = prev.findIndex((t) => t.key === key);
            return prev.slice(0, idx + 1);
          });
        },
      },
      { type: 'divider' },
      {
        key: 'duplicate',
        label: '复制标签',
        icon: <CopyOutlined />,
        onClick: () => {
          const tab = tabs.find((t) => t.key === key);
          if (tab) addNewTab(tab.url);
        },
      },
    ],
    [tabs, addNewTab]
  );

  // ========== 渲染 ==========
  const activeTab = tabs.find((t) => t.key === activeTabKey);
  const isSecure = activeTab?.url?.startsWith('https://');

  return (
    <div
      style={{
        height: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #f0f0f0',
      }}
    >
      {/* 标签栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
          minHeight: 38,
        }}
      >
        <Tabs
          type="editable-card"
          size="small"
          activeKey={activeTabKey}
          onChange={switchTab}
          onEdit={(targetKey, action) => {
            if (action === 'add') addNewTab();
            if (action === 'remove') closeTab(targetKey);
          }}
          hideAdd={false}
          items={tabs.map((tab) => ({
            key: tab.key,
            label: (
              <Dropdown
                menu={{ items: getTabMenuItems(tab.key) }}
                trigger={['contextMenu']}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.isLoading ? (
                    <Spin size="small" style={{ marginRight: 4 }} />
                  ) : tab.favicon ? (
                    <img
                      src={tab.favicon}
                      alt=""
                      style={{ width: 14, height: 14 }}
                    />
                  ) : (
                    <GlobalOutlined style={{ fontSize: 12, color: '#999' }} />
                  )}
                  {tab.title}
                </span>
              </Dropdown>
            ),
            closable: tabs.length > 1,
          }))}
          style={{ flex: 1, marginBottom: 0, marginLeft: 8 }}
          tabBarStyle={{ margin: 0 }}
        />
      </div>

      {/* 导航栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fff',
        }}
      >
        <Space size={4}>
          <Tooltip title="后退">
            <Button
              size="small"
              type="text"
              icon={<ArrowLeftOutlined />}
              disabled={!activeTab?.canGoBack}
              onClick={handleGoBack}
            />
          </Tooltip>
          <Tooltip title="前进">
            <Button
              size="small"
              type="text"
              icon={<ArrowRightOutlined />}
              disabled={!activeTab?.canGoForward}
              onClick={handleGoForward}
            />
          </Tooltip>
          <Tooltip title={activeTab?.isLoading ? '停止' : '刷新'}>
            <Button
              size="small"
              type="text"
              icon={<ReloadOutlined spin={activeTab?.isLoading} />}
              onClick={activeTab?.isLoading ? handleStop : handleReload}
            />
          </Tooltip>
          <Tooltip title="主页">
            <Button
              size="small"
              type="text"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            />
          </Tooltip>
        </Space>

        {/* 地址栏 */}
        <Input
          size="small"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleAddressKeyDown}
          onFocus={(e) => e.target.select()}
          placeholder="输入网址或搜索..."
          prefix={
            isSecure ? (
              <LockOutlined style={{ color: '#52c41a', fontSize: 12 }} />
            ) : (
              <GlobalOutlined style={{ color: '#999', fontSize: 12 }} />
            )
          }
          style={{ flex: 1 }}
          allowClear
        />

        <Space size={4}>
          <Tooltip title="收藏">
            <Button
              size="small"
              type="text"
              icon={<StarOutlined />}
              onClick={handleBookmark}
            />
          </Tooltip>
        </Space>

        {/* 用户指示器 */}
        {currentUser && (
          <Tooltip
            title={`当前用户: ${currentUser.name}（会话隔离中）`}
          >
            <Badge dot status="success" offset={[-2, 2]}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#1677ff',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'default',
                }}
              >
                {currentUser.name?.[0]?.toUpperCase() || '?'}
              </div>
            </Badge>
          </Tooltip>
        )}
      </div>

      {/* webview 容器 */}
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {tabs.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Empty description="点击 + 新建标签页">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => addNewTab()}
              >
                新建标签
              </Button>
            </Empty>
          </div>
        ) : (
          tabs.map((tab) => (
            <div
              key={tab.key}
              style={{
                display: tab.key === activeTabKey ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
              }}
            >
              {tab.url === NEW_TAB_URL || tab.url === 'about:blank' ? (
                <NewTabPage onNavigate={handleNavigate} />
              ) : (
                <webview
                  ref={(el) => {
                    if (el && !webviewRefs.current[tab.key]) {
                      handleWebviewEvents(tab.key, el);
                    }
                  }}
                  src={tab.url}
                  partition={getPartition()}
                  style={{ width: '100%', height: '100%', flex: 1 }}
                  allowpopups="true"
                  preload={`file://${window.__MUB_PRELOAD_PATH__ || ''}`}
                  webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=no"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ========== 新标签页 ==========
function NewTabPage({ onNavigate }) {
  const quickLinks = [
    { title: 'Google', url: 'https://www.google.com', icon: '🔍' },
    { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
    { title: 'YouTube', url: 'https://www.youtube.com', icon: '📺' },
    { title: '百度', url: 'https://www.baidu.com', icon: '🐻' },
    { title: 'Bilibili', url: 'https://www.bilibili.com', icon: '🎮' },
    { title: '知乎', url: 'https://www.zhihu.com', icon: '💡' },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
        padding: 48,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌐</div>
        <div style={{ fontSize: 24, fontWeight: 600, color: '#333' }}>
          Multi-User Browser
        </div>
        <div style={{ color: '#999', marginTop: 4 }}>
          在地址栏输入网址，或点击下方快捷链接
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          maxWidth: 480,
        }}
      >
        {quickLinks.map((link) => (
          <div
            key={link.url}
            onClick={() => onNavigate(link.url)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '16px 24px',
              background: '#fff',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <span style={{ fontSize: 28 }}>{link.icon}</span>
            <span style={{ fontSize: 13, color: '#333' }}>{link.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
