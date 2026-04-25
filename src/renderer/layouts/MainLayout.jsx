import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  UserOutlined,
  GlobalOutlined,
  FolderOutlined,
  DownloadOutlined,
  CodeOutlined,
  SettingOutlined,
  StarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import NotificationBell from '../components/NotificationBell';

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: '/browser', icon: <GlobalOutlined />, label: '浏览器' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { type: 'divider' },
  { key: '/bookmarks', icon: <StarOutlined />, label: '书签' },
  { key: '/history', icon: <HistoryOutlined />, label: '历史' },
  { type: 'divider' },
  { key: '/files', icon: <FolderOutlined />, label: '文件管理' },
  { key: '/downloads', icon: <DownloadOutlined />, label: '下载管理' },
  { key: '/scripts', icon: <CodeOutlined />, label: '脚本管理' },
  { type: 'divider' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  const currentLabel =
    menuItems.find((item) => item.key === location.pathname)?.label || '';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        theme="light"
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
            color: token.colorPrimary,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/browser')}
        >
          🌐 Multi-User Browser
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
            {currentLabel}
          </h2>
          <NotificationBell />
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
