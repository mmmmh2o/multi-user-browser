import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Tooltip } from 'antd';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import { menuItems, findMenuLabel } from '../config/menu';

/* ─── Logo 区域 ─── */
function SidebarLogo({ compact }) {
  return (
    <div style={{
      height: compact ? 48 : 64,
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
function SidebarMenu({ navigate, pathname }) {
  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
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
  const isBrowserPage = location.pathname === '/browser';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ─── 统一的深色侧边栏 ─── */}
      <Layout.Sider
        width={isBrowserPage ? 56 : 220}
        collapsedWidth={56}
        collapsed={isBrowserPage}
        className="mub-sidebar"
        style={{
          background: 'linear-gradient(180deg, #1a1f36 0%, #1e2235 100%)',
          borderRight: 'none',
          boxShadow: '2px 0 16px rgba(0,0,0,0.12)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <SidebarLogo compact={isBrowserPage} />
        <SidebarMenu navigate={navigate} pathname={location.pathname} />
      </Layout.Sider>

      {/* ─── 主内容区 ─── */}
      <Layout style={{ transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        {/* 管理页面：显示 Header；浏览器页面：隐藏 */}
        {!isBrowserPage && (
          <Layout.Header className="mub-page-header">
            <h2 className="mub-page-title">
              {findMenuLabel(location.pathname)}
            </h2>
            <NotificationBell />
          </Layout.Header>
        )}

        <Layout.Content
          style={{
            padding: isBrowserPage ? 0 : 'var(--mub-space-lg)',
            background: isBrowserPage ? '#fff' : 'var(--mub-bg)',
            overflow: 'auto',
            flex: 1,
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
