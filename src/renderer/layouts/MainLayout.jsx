import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Drawer, Button, Tooltip } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import RouteTransition from '../components/RouteTransition';
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

/* ─── 浮动操作按钮（浏览器页面用） ─── */
function BrowserFloatingButtons({ onOpenMenu }) {
  return (
    <>
      <Tooltip title="菜单" placement="right">
        <Button
          icon={<MenuOutlined />}
          shape="circle"
          size="large"
          onClick={onOpenMenu}
          className="mub-float-btn"
        />
      </Tooltip>
      <div className="mub-float-btn mub-float-btn--right">
        <NotificationBell darkMode />
      </div>
    </>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const isBrowserPage = location.pathname === '/browser';

  // 路由切换时触发过渡动画
  useEffect(() => {
    setTransitioning(true);
    const timer = setTimeout(() => setTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  /* ─── 浏览器页面：全屏 + 浮动入口 ─── */
  if (isBrowserPage) {
    return (
      <div style={{ height: '100vh', position: 'relative' }}>
        <BrowserFloatingButtons onOpenMenu={() => setDrawerOpen(true)} />

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

        <div
          style={{
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.2s ease',
            height: '100%',
          }}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  /* ─── 管理页面：深色侧边栏 + 主区域 ─── */
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
        {/* Header：深色底边框过渡，不再是纯白 */}
        <Layout.Header className="mub-page-header">
          <h2 className="mub-page-title">
            {findMenuLabel(location.pathname)}
          </h2>
          <NotificationBell />
        </Layout.Header>

        <Layout.Content className="mub-page-content">
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(4px)' : 'translateY(0)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
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
