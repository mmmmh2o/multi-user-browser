import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Drawer, Button, Tooltip } from 'antd';
import {
  UserSwitchOutlined,
  GlobalOutlined,
  FolderOutlined,
  DownloadOutlined,
  CodeOutlined,
  SettingOutlined,
  StarOutlined,
  HistoryOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';

const { Content } = Layout;

/* ─── 菜单配置（分组） ─── */
const menuGroups = [
  {
    key: 'nav',
    items: [
      { key: '/browser', icon: <GlobalOutlined />, label: '浏览器' },
      { key: '/containers', icon: <UserSwitchOutlined />, label: '身份容器' },
    ],
  },
  {
    key: 'data',
    label: '数据',
    items: [
      { key: '/bookmarks', icon: <StarOutlined />, label: '书签' },
      { key: '/history', icon: <HistoryOutlined />, label: '历史' },
    ],
  },
  {
    key: 'tools',
    label: '工具',
    items: [
      { key: '/files', icon: <FolderOutlined />, label: '文件管理' },
      { key: '/downloads', icon: <DownloadOutlined />, label: '下载管理' },
      { key: '/scripts', icon: <CodeOutlined />, label: '脚本管理' },
    ],
  },
  {
    key: 'system',
    items: [
      { key: '/settings', icon: <SettingOutlined />, label: '设置' },
    ],
  },
];

/* 把分组拍平为 Menu items */
const buildMenuItems = () => {
  const items = [];
  menuGroups.forEach((group, gi) => {
    if (gi > 0) items.push({ type: 'divider', key: `div-${gi}` });
    if (group.label) {
      items.push({
        type: 'group',
        label: (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: 'rgba(255,255,255,0.35)',
            paddingLeft: 4,
          }}>
            {group.label}
          </span>
        ),
        key: `grp-${group.key}`,
        children: group.items,
      });
    } else {
      items.push(...group.items);
    }
  });
  return items;
};

const menuItems = buildMenuItems();

/* ─── Logo 区域 ─── */
function SidebarLogo({ compact }) {
  return (
    <div
      className={`mub-sidebar-logo${compact ? ' mub-sidebar-logo--compact' : ''}`}
      role="banner"
      aria-label="Multi-User Browser"
    >
      <div className="mub-sidebar-logo__icon" aria-hidden="true">🌐</div>
      {!compact && (
        <div className="mub-sidebar-logo__text">
          <div className="mub-sidebar-logo__title">Multi-User</div>
          <div className="mub-sidebar-logo__subtitle">BROWSER</div>
        </div>
      )}
    </div>
  );
}

/* ─── 侧边栏菜单 ─── */
function SidebarMenu({ navigate, pathname, mode, onClose }) {
  return (
    <Menu
      mode={mode || 'inline'}
      selectedKeys={[pathname]}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key);
        onClose?.();
      }}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '8px 8px',
      }}
      theme="dark"
      role="navigation"
      aria-label="主导航"
    />
  );
}

/* ─── 响应式检测 Hook ─── */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia?.(query).matches ?? false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const isBrowserPage = location.pathname === '/browser';

  /* ─── 浏览器页面：全屏 + 浮动入口 ─── */
  if (isBrowserPage) {
    return (
      <div style={{ height: '100vh', position: 'relative' }}>
        {/* 浮动菜单按钮 */}
        <Tooltip title="菜单" placement="right">
          <Button
            icon={<MenuOutlined />}
            shape="circle"
            size="large"
            onClick={() => setDrawerOpen(true)}
            className="mub-browser-fab mub-browser-fab--left"
            aria-label="打开导航菜单"
            style={{ color: '#fff' }}
          />
        </Tooltip>

        {/* 浮动通知铃铛 */}
        <div className="mub-browser-fab mub-browser-fab--right" role="status" aria-label="通知">
          <NotificationBell darkMode />
        </div>

        {/* 侧边栏抽屉 */}
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{
            body: { padding: 0, background: 'var(--mub-bg-sidebar)' },
            header: { background: 'var(--mub-bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
          }}
          title={
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
              🌐 Multi-User Browser
            </span>
          }
          className="mub-sidebar"
        >
          <SidebarMenu
            navigate={navigate}
            pathname={location.pathname}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>

        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    );
  }

  /* ─── 管理页面：侧边栏 + 主区域 ─── */
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 移动端遮罩 */}
      {isMobile && (
        <div
          className={`mub-sidebar-overlay${drawerOpen ? ' mub-sidebar-overlay--visible' : ''}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 侧边栏 */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{
            body: { padding: 0, background: 'var(--mub-bg-sidebar)' },
            header: { background: 'var(--mub-bg-sidebar)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
          }}
          title={
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
              🌐 Multi-User Browser
            </span>
          }
          className="mub-sidebar"
        >
          <SidebarMenu
            navigate={navigate}
            pathname={location.pathname}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>
      ) : (
        <Layout.Sider
          width={220}
          className="mub-sidebar"
        >
          <SidebarLogo />
          <SidebarMenu
            navigate={navigate}
            pathname={location.pathname}
          />
        </Layout.Sider>
      )}

      <Layout>
        {/* 顶部 Header */}
        <Layout.Header className="mub-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                aria-label="打开导航菜单"
              />
            )}
            <h1 className="mub-header__title">
              {menuItems
                .filter(item => !item.type)
                .flatMap(item => item.children || [item])
                .find(item => item.key === location.pathname)?.label || ''}
            </h1>
          </div>
          <NotificationBell />
        </Layout.Header>

        {/* 内容区 */}
        <Content className="mub-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
