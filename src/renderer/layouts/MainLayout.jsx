import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Drawer, Button, Tooltip, Badge } from 'antd';
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
  BellOutlined,
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

/* 把分组拍平为 Menu items（带 divider + group label） */
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

/* ─── 侧边栏通用样式 ─── */
const SIDEBAR_STYLE = {
  background: 'linear-gradient(180deg, #1a1f36 0%, #1e2235 100%)',
  borderRight: 'none',
  boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
};

/* ─── Logo 区域 ─── */
function SidebarLogo({ compact }) {
  return (
    <div style={{
      height: compact ? 56 : 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: compact ? 'center' : 'flex-start',
      gap: 10,
      padding: compact ? '0' : '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      cursor: 'pointer',
      flexShrink: 0,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #4f6ef7 0%, #7c5cfc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(79,110,247,0.4)',
      }}>
        🌐
      </div>
      {!compact && (
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            letterSpacing: -0.3,
          }}>
            Multi-User
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            letterSpacing: 0.5,
          }}>
            BROWSER
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 侧边栏菜单（深色主题覆写） ─── */
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
    />
  );
}

/* ─── 深色菜单注入样式 ─── */
const DARK_MENU_CSS = `
  .mub-sidebar .ant-menu-dark {
    background: transparent !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item {
    color: rgba(255,255,255,0.65) !important;
    margin: 2px 0 !important;
    border-radius: 8px !important;
    height: 38px !important;
    line-height: 38px !important;
    padding-left: 12px !important;
    transition: all 0.2s ease !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item:hover {
    color: #fff !important;
    background: rgba(255,255,255,0.08) !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item-selected {
    color: #fff !important;
    background: linear-gradient(90deg, rgba(79,110,247,0.35) 0%, rgba(79,110,247,0.15) 100%) !important;
    box-shadow: inset 3px 0 0 0 #4f6ef7 !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item-selected .ant-menu-item-icon {
    color: #4f6ef7 !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item-icon {
    font-size: 15px !important;
    margin-right: 10px !important;
  }
  .mub-sidebar .ant-menu-dark .ant-menu-item .ant-menu-item-icon + span {
    font-size: 13px !important;
    font-weight: 500 !important;
  }
  .mub-sidebar .ant-divider {
    border-color: rgba(255,255,255,0.06) !important;
    margin: 6px 12px !important;
  }
  .mub-sidebar .ant-menu-item-group-title {
    padding: 8px 12px 4px !important;
  }
`;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
            style={{
              position: 'fixed',
              top: 14,
              left: 14,
              zIndex: 1000,
              background: 'rgba(30,34,53,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              width: 38,
              height: 38,
            }}
          />
        </Tooltip>

        {/* 浮动通知铃铛 */}
        <div style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 1000,
          background: 'rgba(30,34,53,0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <NotificationBell darkMode />
        </div>

        {/* 侧边栏抽屉 */}
        <style>{DARK_MENU_CSS}</style>
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={240}
          styles={{
            body: { padding: 0, background: '#1e2235' },
            header: { background: '#1e2235', borderBottom: '1px solid rgba(255,255,255,0.08)' },
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

  /* ─── 管理页面：深色侧边栏 + 白色主区域 ─── */
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <style>{DARK_MENU_CSS}</style>
      <Layout.Sider
        width={220}
        style={SIDEBAR_STYLE}
        className="mub-sidebar"
      >
        <SidebarLogo />
        <SidebarMenu
          navigate={navigate}
          pathname={location.pathname}
        />
      </Layout.Sider>

      <Layout>
        {/* 顶部 Header */}
        <Layout.Header style={{
          background: '#fff',
          padding: '0 28px',
          borderBottom: '1px solid var(--mub-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          lineHeight: '56px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--mub-text)',
            letterSpacing: -0.2,
          }}>
            {menuItems
              .filter(item => !item.type)
              .flatMap(item => item.children || [item])
              .find(item => item.key === location.pathname)?.label || ''}
          </h2>
          <NotificationBell />
        </Layout.Header>

        {/* 内容区 */}
        <Layout.Content style={{
          padding: 24,
          background: 'var(--mub-bg)',
          overflow: 'auto',
        }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
