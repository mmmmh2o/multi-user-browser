import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button, Input, Space, Tabs, Dropdown, Spin, Tooltip, Empty, message, Tag,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  HomeOutlined, LockOutlined, GlobalOutlined, StarOutlined,
  CloseCircleOutlined, CopyOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

const HOME_URL = 'about:blank';
const NEW_TAB_URL = 'about:blank';

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  baidu: 'https://www.baidu.com/s?wd=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
};

export default function Browser() {
  const [tabs, setTabs] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState(null);
  const [address, setAddress] = useState('');
  const [containers, setContainers] = useState([]);
  const [preloadReady, setPreloadReady] = useState(false);
  const [searchEngine, setSearchEngine] = useState('google');
  const webviewRefs = useRef({});
  const activeTabKeyRef = useRef(null);
  useEffect(() => { activeTabKeyRef.current = activeTabKey; }, [activeTabKey]);

  useEffect(() => {
    loadContainers();
    loadHomepage().then((home) => addNewTab(home));
    // 加载搜索引擎设置
    window.electronAPI?.getSettings?.().then((s) => {
      if (s?.searchEngine) setSearchEngine(s.searchEngine);
    }).catch(() => {});
    const checkPreload = () => {
      if (window.__MUB_PRELOAD_PATH__ !== undefined) setPreloadReady(true);
      else setTimeout(checkPreload, 100);
    };
    checkPreload();
    const handleNavigateEvent = (e) => {
      const { url } = e.detail || {};
      if (!url) return;
      setTabs((prev) => {
        const singleBlank = prev.length === 1 && (prev[0].url === NEW_TAB_URL || prev[0].url === 'about:blank');
        if (singleBlank) {
          const updated = { ...prev[0], url, isLoading: true };
          setActiveTabKey(updated.key);
          setAddress(url);
          setTimeout(() => { const wv = webviewRefs.current[updated.key]; if (wv) wv.loadURL(url); }, 0);
          return [updated];
        }
        setTimeout(() => addNewTab(url), 0);
        return prev;
      });
    };
    window.addEventListener('mub-navigate', handleNavigateEvent);
    return () => window.removeEventListener('mub-navigate', handleNavigateEvent);
  }, []);

  const loadContainers = async () => {
    try { setContainers((await window.electronAPI.getContainers()) || []); }
    catch (e) { console.error('加载容器失败:', e); }
  };
  const loadHomepage = async () => {
    try { return (await window.electronAPI.getSettings())?.homepage || 'about:blank'; }
    catch { return 'about:blank'; }
  };

  const addNewTab = useCallback((url = NEW_TAB_URL, containerId = 'default') => {
    const key = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const container = containers.find((c) => c.id === containerId) || { id: 'default', name: '默认', color: '#8c8c8c' };
    const newTab = {
      key, title: '新标签页', url, containerId,
      containerName: container.name, containerColor: container.color,
      isLoading: false, canGoBack: false, canGoForward: false, favicon: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabKey(key);
    setAddress(url === NEW_TAB_URL ? '' : url);
    return key;
  }, [containers]);

  const closeTab = useCallback((targetKey) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === targetKey);
      if (idx === -1) return prev;
      const next = prev.filter((t) => t.key !== targetKey);
      if (activeTabKey === targetKey) {
        if (next.length === 0) { setTimeout(() => addNewTab(), 0); return next; }
        const newIdx = Math.min(idx, next.length - 1);
        setActiveTabKey(next[newIdx].key);
        setAddress(next[newIdx].url === NEW_TAB_URL ? '' : next[newIdx].url);
      }
      return next;
    });
    delete webviewRefs.current[targetKey];
  }, [activeTabKey, addNewTab]);

  const switchTab = useCallback((key) => {
    setActiveTabKey(key);
    const tab = tabs.find((t) => t.key === key);
    if (tab) setAddress(tab.url === NEW_TAB_URL ? '' : tab.url);
  }, [tabs]);

  const setTabContainer = useCallback((tabKey, containerId) => {
    const container = containers.find((c) => c.id === containerId) || { id: 'default', name: '默认', color: '#8c8c8c' };
    setTabs((prev) => prev.map((t) =>
      t.key === tabKey ? { ...t, containerId, containerName: container.name, containerColor: container.color } : t
    ));
    const wv = webviewRefs.current[tabKey];
    if (wv) {
      const tab = tabs.find((t) => t.key === tabKey);
      if (tab && tab.url !== NEW_TAB_URL) {
        delete webviewRefs.current[tabKey];
        setTabs((prev) => prev.map((t) => t.key === tabKey ? { ...t, isLoading: true } : t));
      }
    }
  }, [containers, tabs]);

  const getPartition = useCallback((containerId) =>
    containerId && containerId !== 'default' ? `persist:container-${containerId}` : 'persist:default', []);

  const getActiveWebview = useCallback(() =>
    activeTabKey ? webviewRefs.current[activeTabKey] : null, [activeTabKey]);

  const handleNavigate = useCallback((input) => {
    if (!input.trim()) return;
    let url = input.trim();
    if (url === 'about:blank') { /* ok */ }
    else if (/^https?:\/\//i.test(url)) { /* full URL */ }
    else if (/^[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(url)) url = `https://${url}`;
    else {
      const engineUrl = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.google;
      url = `${engineUrl}${encodeURIComponent(url)}`;
    }
    const wv = getActiveWebview();
    if (wv) wv.loadURL(url);
    setTabs((prev) => prev.map((t) => t.key === activeTabKey ? { ...t, url, isLoading: true } : t));
    setAddress(url);
  }, [activeTabKey, getActiveWebview, searchEngine]);

  const handleGoBack = useCallback(() => { const wv = getActiveWebview(); if (wv?.canGoBack()) wv.goBack(); }, [getActiveWebview]);
  const handleGoForward = useCallback(() => { const wv = getActiveWebview(); if (wv?.canGoForward()) wv.goForward(); }, [getActiveWebview]);
  const handleReload = useCallback(() => { const wv = getActiveWebview(); if (wv) wv.reload(); }, [getActiveWebview]);
  const handleStop = useCallback(() => { const wv = getActiveWebview(); if (wv) wv.stop(); }, [getActiveWebview]);
  const handleGoHome = useCallback(async () => { handleNavigate(await loadHomepage()); }, [handleNavigate]);

  const handleBookmark = useCallback(async () => {
    const tab = tabs.find((t) => t.key === activeTabKey);
    if (!tab || tab.url === NEW_TAB_URL || tab.url === 'about:blank') { message.warning('无法收藏空白页'); return; }
    try {
      await window.electronAPI.saveBookmark({ title: tab.title, url: tab.url, favicon: tab.favicon });
      message.success('已添加书签');
    } catch { message.error('收藏失败'); }
  }, [tabs, activeTabKey]);

  const handleWebviewEvents = useCallback((key, webview) => {
    if (!webview) return;

    // 立即注册窗口拦截，不等 dom-ready，防止链接弹出小窗口
    try {
      if (webview.setWindowOpenHandler) {
        webview.setWindowOpenHandler(({ url }) => {
          const parentTab = tabs.find((t) => t.key === key);
          addNewTab(url, parentTab?.containerId || 'default');
          return { action: 'deny' };
        });
      }
    } catch {}

    webview.addEventListener('did-start-loading', () => setTabs((prev) => prev.map((t) => t.key === key ? { ...t, isLoading: true } : t)));
    webview.addEventListener('did-stop-loading', () => setTabs((prev) => prev.map((t) => t.key === key ? { ...t, isLoading: false } : t)));
    webview.addEventListener('page-title-updated', (e) => setTabs((prev) => prev.map((t) => t.key === key ? { ...t, title: e.title || '无标题' } : t)));
    webview.addEventListener('page-favicon-updated', (e) => { if (e.favicons?.length > 0) setTabs((prev) => prev.map((t) => t.key === key ? { ...t, favicon: e.favicons[0] } : t)); });
    webview.addEventListener('did-navigate', (e) => {
      safeCall(() => window.electronAPI.addHistory({ url: e.url, title: webview.getTitle() || e.url }));
      setTabs((prev) => prev.map((t) => t.key === key ? { ...t, url: e.url, canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() } : t));
      if (key === activeTabKeyRef.current) setAddress(e.url);
    });
    webview.addEventListener('did-navigate-in-page', (e) => {
      if (e.isMainFrame) {
        setTabs((prev) => prev.map((t) => t.key === key ? { ...t, url: e.url, canGoBack: webview.canGoBack(), canGoForward: webview.canGoForward() } : t));
        if (key === activeTabKeyRef.current) setAddress(e.url);
      }
    });
    webview.addEventListener('did-fail-load', (e) => {
      if (e.errorCode !== -3) {
        setTabs((prev) => prev.map((t) => t.key === key ? { ...t, isLoading: false } : t));
        message.error(`加载失败: ${e.errorDescription}`);
      }
    });
    webviewRefs.current[key] = webview;
  }, [addNewTab, tabs]);

  const handleAddressKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleNavigate(address);
    if (e.key === 'Escape') { const tab = tabs.find((t) => t.key === activeTabKey); if (tab) setAddress(tab.url === NEW_TAB_URL ? '' : tab.url); }
  }, [address, handleNavigate, tabs, activeTabKey]);

  const getTabMenuItems = useCallback((key) => {
    const tab = tabs.find((t) => t.key === key);
    const containerItems = containers.map((c) => ({
      key: `container-${c.id}`,
      label: (<span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.color, marginRight: 8 }} />{c.name}</span>),
      onClick: () => setTabContainer(key, c.id),
    }));
    return [
      { key: 'container', label: '切换身份', children: containerItems },
      { type: 'divider' },
      { key: 'close-others', label: '关闭其他标签', icon: <CloseCircleOutlined />, onClick: () => { setTabs((prev) => prev.filter((t) => t.key === key)); setActiveTabKey(key); } },
      { key: 'close-right', label: '关闭右侧标签', onClick: () => { setTabs((prev) => { const idx = prev.findIndex((t) => t.key === key); return prev.slice(0, idx + 1); }); } },
      { type: 'divider' },
      { key: 'duplicate', label: '复制标签', icon: <CopyOutlined />, onClick: () => { if (tab) addNewTab(tab.url, tab.containerId); } },
    ];
  }, [tabs, containers, addNewTab, setTabContainer]);

  const activeTab = tabs.find((t) => t.key === activeTabKey);
  const isSecure = activeTab?.url?.startsWith('https://');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
      {/* ─── 标签栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--mub-border-light)',
        background: 'var(--mub-bg-table-header)',
        minHeight: 38, paddingLeft: 8,
      }}>
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
              <Dropdown menu={{ items: getTabMenuItems(tab.key) }} trigger={['contextMenu']}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: 12.5,
                }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: tab.containerColor || '#8c8c8c', flexShrink: 0,
                    boxShadow: `0 0 0 1.5px ${tab.containerColor || '#8c8c8c'}30`,
                  }} title={tab.containerName || '默认'} />
                  {tab.isLoading
                    ? <Spin size="small" style={{ marginRight: 2 }} />
                    : tab.favicon
                      ? <img src={tab.favicon} alt="" style={{ width: 14, height: 14 }} />
                      : <GlobalOutlined style={{ fontSize: 11, color: '#bbb' }} />
                  }
                  {tab.title}
                </span>
              </Dropdown>
            ),
            closable: tabs.length > 1,
          }))}
          style={{ flex: 1, marginBottom: 0, marginLeft: 4 }}
          tabBarStyle={{ margin: 0 }}
        />
      </div>

      {/* ─── 导航栏 ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        borderBottom: '1px solid var(--mub-border-light)',
        background: '#fff',
      }}>
        {/* 导航按钮组 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: 'var(--mub-bg)', borderRadius: 8, padding: 2,
        }}>
          <Tooltip title="后退">
            <Button size="small" type="text" icon={<ArrowLeftOutlined />}
              disabled={!activeTab?.canGoBack} onClick={handleGoBack}
              style={{ borderRadius: 6, width: 30, height: 30 }} />
          </Tooltip>
          <Tooltip title="前进">
            <Button size="small" type="text" icon={<ArrowRightOutlined />}
              disabled={!activeTab?.canGoForward} onClick={handleGoForward}
              style={{ borderRadius: 6, width: 30, height: 30 }} />
          </Tooltip>
          <Tooltip title={activeTab?.isLoading ? '停止' : '刷新'}>
            <Button size="small" type="text"
              icon={<ReloadOutlined spin={activeTab?.isLoading} />}
              onClick={activeTab?.isLoading ? handleStop : handleReload}
              style={{ borderRadius: 6, width: 30, height: 30 }} />
          </Tooltip>
          <Tooltip title="主页">
            <Button size="small" type="text" icon={<HomeOutlined />} onClick={handleGoHome}
              style={{ borderRadius: 6, width: 30, height: 30 }} />
          </Tooltip>
        </div>

        {/* 容器选择器 */}
        <Dropdown
          menu={{
            items: containers.map((c) => ({
              key: c.id,
              label: (<span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c.color, marginRight: 8 }} />{c.name}</span>),
            })),
            onClick: ({ key }) => { if (activeTabKey) setTabContainer(activeTabKey, key); },
          }}
          trigger={['click']}
        >
          <Tooltip title="切换当前标签身份">
            <Tag style={{
              cursor: 'pointer', margin: 0, borderRadius: 16,
              lineHeight: '22px', padding: '1px 10px',
              fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 5,
            }} color={activeTab?.containerColor || '#8c8c8c'}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: activeTab?.containerColor || '#8c8c8c',
                display: 'inline-block', boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
              }} />
              {activeTab?.containerName || '默认'}
            </Tag>
          </Tooltip>
        </Dropdown>

        {/* 地址栏 */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center',
          background: 'var(--mub-bg)', borderRadius: 20,
          padding: '0 12px', height: 34,
          border: '1px solid transparent',
          transition: 'all 0.2s ease',
        }}>
          {isSecure
            ? <LockOutlined style={{ color: 'var(--mub-success)', fontSize: 12, marginRight: 6 }} />
            : <GlobalOutlined style={{ color: 'var(--mub-text-muted)', fontSize: 12, marginRight: 6 }} />
          }
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            onFocus={(e) => e.target.select()}
            placeholder="输入网址或搜索..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: 'var(--mub-text)', lineHeight: '32px',
            }}
          />
        </div>

        {/* 收藏按钮 */}
        <Tooltip title="收藏">
          <Button size="small" type="text" icon={<StarOutlined />} onClick={handleBookmark}
            style={{ borderRadius: 6, width: 32, height: 32 }} />
        </Tooltip>
      </div>

      {/* ─── webview 容器 ─── */}
      <div style={{ flex: 1, position: 'relative', background: '#fff' }}>
        {tabs.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="点击 + 新建标签页">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => addNewTab()}>新建标签</Button>
            </Empty>
          </div>
        ) : (
          tabs.map((tab) => (
            <div key={tab.key} style={{
              display: tab.key === activeTabKey ? 'flex' : 'none',
              width: '100%', height: '100%', flexDirection: 'column',
            }}>
              {tab.url === NEW_TAB_URL || tab.url === 'about:blank'
                ? <NewTabPage onNavigate={handleNavigate} />
                : (
                  <webview
                    key={`${tab.key}-${tab.containerId}`}
                    ref={(el) => {
                      if (el && !webviewRefs.current[tab.key]) {
                        handleWebviewEvents(tab.key, el);
                        // 确保 webview 加载正确的 URL（React 对 webview src 处理不可靠）
                        if (tab.url && tab.url !== NEW_TAB_URL && tab.url !== 'about:blank') {
                          el.loadURL(tab.url).catch(() => {});
                        }
                      }
                    }}
                    partition={getPartition(tab.containerId)}
                    style={{ width: '100%', height: '100%', flex: 1 }}
                    preload={preloadReady ? `file://${window.__MUB_PRELOAD_PATH__}` : undefined}
                    webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=no"
                  />
                )
              }
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── 新标签页 ─── */
function NewTabPage({ onNavigate }) {
  const [searchValue, setSearchValue] = useState('');
  const quickLinks = [
    { title: 'Google', url: 'https://www.google.com', icon: '🔍', color: '#4285f4' },
    { title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#333' },
    { title: 'YouTube', url: 'https://www.youtube.com', icon: '📺', color: '#ff0000' },
    { title: '百度', url: 'https://www.baidu.com', icon: '🐻', color: '#2932e1' },
    { title: 'Bilibili', url: 'https://www.bilibili.com', icon: '🎮', color: '#fb7299' },
    { title: '知乎', url: 'https://www.zhihu.com', icon: '💡', color: '#0066ff' },
  ];

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 36,
      background: 'linear-gradient(160deg, #f8f9fc 0%, #eef1f6 50%, #e8ecf4 100%)',
      padding: 48,
    }}>
      {/* Logo + 标题 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #4f6ef7 0%, #7c5cfc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, boxShadow: '0 8px 24px rgba(79,110,247,0.3)',
        }}>
          🌐
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--mub-text)', letterSpacing: -0.5 }}>
          Multi-User Browser
        </div>
        <div style={{ color: 'var(--mub-text-muted)', marginTop: 6, fontSize: 13.5 }}>
          在地址栏输入网址，或点击下方快捷链接
        </div>
      </div>

      {/* 搜索框 */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#fff', borderRadius: 24, padding: '0 20px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        border: '1px solid var(--mub-border-light)',
        display: 'flex', alignItems: 'center', height: 46,
      }}>
        <span style={{ fontSize: 16, marginRight: 10, opacity: 0.4 }}>🔍</span>
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchValue.trim()) {
              onNavigate(searchValue.trim());
            }
          }}
          placeholder="搜索或输入网址..."
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: 'var(--mub-text)', lineHeight: '44px',
          }}
        />
      </div>

      {/* 快捷链接 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, maxWidth: 480, width: '100%',
      }}>
        {quickLinks.map((link) => (
          <div
            key={link.url}
            onClick={() => onNavigate(link.url)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: '18px 16px', background: 'rgba(255,255,255,0.8)',
              borderRadius: 14, cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${link.color}18`;
              e.currentTarget.style.borderColor = `${link.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${link.color}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {link.icon}
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--mub-text)' }}>{link.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
