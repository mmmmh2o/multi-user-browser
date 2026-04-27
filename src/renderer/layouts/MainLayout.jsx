import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Drawer, Button, Tooltip } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import { menuItems, findMenuLabel } from '../config/menu';

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
        borderRadius: 'var(--mub-radius-sm)',
        background: 'linear-gradient(135deg, var(--mub-primary) 0%, #7c5cfc 100%)',
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
            fontSize: 'var(--mub-font-size-xs)',
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
        padding: 'var(--mub-space-sm)',
      }}
      theme="dark"
    />
  );
}

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
              boxShadow: 'var(--mub-shadow-md)',
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
          boxShadow: 'var(--mub-shadow-md)',
        }}>
          <NotificationBell darkMode />
        </div>

        {/* 侧边栏抽屉 */}
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
        <Layout.Header style={{
          background: '#fff',
          padding: '0 28px',
          borderBottom: '1px solid var(--mub-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          lineHeight: '56px',
          boxShadow: 'var(--mub-shadow-sm)',
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 'var(--mub-font-size-lg)',
            fontWeight: 600,
            color: 'var(--mub-text)',
            letterSpacing: -0.2,
          }}>
            {findMenuLabel(location.pathname)}
          </h2>
          <NotificationBell />
        </Layout.Header>

        <Layout.Content style={{
          padding: 'var(--mub-space-lg)',
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
