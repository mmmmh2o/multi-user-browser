import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import { menuItems, findMenuLabel } from '../config/menu';

/* ─── Logo 区域 ─── */
function SidebarLogo({ compact }) {
  return (
    <div
      className="mub-sidebar-logo"
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: 10,
        padding: compact ? '0' : '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'padding 0.3s ease, justify-content 0.3s ease',
      }}
    >
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
        transition: 'transform 0.3s ease',
      }}>
        🌐
      </div>
      <div
        className="mub-sidebar-logo-text"
        style={{
          overflow: 'hidden',
          opacity: compact ? 0 : 1,
          width: compact ? 0 : 'auto',
          transition: 'opacity 0.25s ease, width 0.3s ease',
          whiteSpace: 'nowrap',
        }}
      >
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
    </div>
  );
}

/* ─── 侧边栏菜单 ─── */
function SidebarMenu({ navigate, pathname, collapsed }) {
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
      inlineCollapsed={collapsed}
    />
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBrowserPage = location.pathname === '/browser';

  // 内容过渡状态
  const [contentVisible, setContentVisible] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(!isBrowserPage);

  useEffect(() => {
    // 路由切换：淡出
    setContentVisible(false);

    const timer = setTimeout(() => {
      setHeaderVisible(!isBrowserPage);
      // 淡入
      requestAnimationFrame(() => setContentVisible(true));
    }, 180);

    return () => clearTimeout(timer);
  }, [location.pathname]);

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
          overflow: 'hidden',
        }}
      >
        <SidebarLogo compact={isBrowserPage} />
        <SidebarMenu
          navigate={navigate}
          pathname={location.pathname}
          collapsed={isBrowserPage}
        />
      </Layout.Sider>

      {/* ─── 主内容区 ─── */}
      <Layout>
        {/* Header：带滑入动画 */}
        <div
          style={{
            height: headerVisible ? 56 : 0,
            opacity: headerVisible ? 1 : 0,
            overflow: 'hidden',
            transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
          }}
        >
          <Layout.Header className="mub-page-header" style={{ height: 56 }}>
            <h2 className="mub-page-title">
              {findMenuLabel(location.pathname)}
            </h2>
            <NotificationBell />
          </Layout.Header>
        </div>

        {/* 内容区：淡入 + 微上移 */}
        <Layout.Content
          style={{
            padding: isBrowserPage ? 0 : 'var(--mub-space-lg)',
            background: isBrowserPage ? '#fff' : 'var(--mub-bg)',
            overflow: 'auto',
            flex: 1,
          }}
        >
          <div
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
              height: '100%',
            }}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
