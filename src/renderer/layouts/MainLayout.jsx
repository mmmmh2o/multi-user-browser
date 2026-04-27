import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import { menuItems, findMenuLabel } from '../config/menu';

const SIDEBAR_WIDE = 220;
const SIDEBAR_NARROW = 56;

/* ─── Logo 区域 ─── */
function SidebarLogo({ wide }) {
  return (
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: wide ? 10 : 0,
        padding: '0 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
        overflow: 'hidden',
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
      }}>
        🌐
      </div>
      <div
        style={{
          overflow: 'hidden',
          opacity: wide ? 1 : 0,
          width: wide ? 'auto' : 0,
          whiteSpace: 'nowrap',
          transition: 'opacity 0.2s ease, width 0.25s ease',
          flexShrink: 0,
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

/* ─── 收缩态菜单（只显示图标） ─── */
function SidebarMenuCompact({ navigate, pathname }) {
  const flatItems = menuItems
    .filter(i => !i.type)
    .flatMap(i => i.children || [i]);

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
      {flatItems.map((item) => {
        const isActive = pathname === item.key;
        return (
          <div
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              width: 40,
              height: 38,
              borderRadius: 'var(--mub-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              background: isActive
                ? 'linear-gradient(90deg, rgba(79,110,247,0.35) 0%, rgba(79,110,247,0.15) 100%)'
                : 'transparent',
              boxShadow: isActive ? 'inset 3px 0 0 0 var(--mub-primary)' : 'none',
              fontSize: 15,
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
            title={item.label}
          >
            {item.icon}
          </div>
        );
      })}
    </div>
  );
}

/* ─── 侧边栏底部：展开/收缩按钮 ─── */
function SidebarToggle({ collapsed, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        height: 44,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        transition: 'color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    </div>
  );
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBrowserPage = location.pathname === '/browser';

  // 侧边栏收缩状态（浏览器页强制收缩，其他页由用户控制）
  const [userCollapsed, setUserCollapsed] = useState(false);
  const collapsed = isBrowserPage || userCollapsed;

  // 内容过渡
  const [contentVisible, setContentVisible] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(!isBrowserPage);

  const sidebarWidth = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;

  // 路由切换时的内容过渡
  useEffect(() => {
    setContentVisible(false);
    const t = setTimeout(() => {
      setHeaderVisible(!isBrowserPage);
      setContentVisible(true);
    }, 250);
    return () => clearTimeout(t);
  }, [location.pathname]);

  const handleToggle = () => {
    if (isBrowserPage) return; // 浏览器页不允许手动展开
    setUserCollapsed(v => !v);
  };

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* ─── 侧边栏 ─── */}
      <div
        className="mub-sidebar"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          height: '100%',
          background: 'linear-gradient(180deg, #1a1f36 0%, #1e2235 100%)',
          boxShadow: '2px 0 16px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <SidebarLogo wide={!collapsed} />
        {!collapsed
          ? <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              onClick={({ key }) => navigate(key)}
              style={{ background: 'transparent', border: 'none', padding: 'var(--mub-space-sm)', flex: 1 }}
              theme="dark"
            />
          : <SidebarMenuCompact navigate={navigate} pathname={location.pathname} />
        }
        <SidebarToggle collapsed={collapsed} onToggle={handleToggle} />
      </div>

      {/* ─── 主内容区 ─── */}
      <Layout style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
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

        {/* 内容区 */}
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
