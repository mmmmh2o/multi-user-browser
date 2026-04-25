import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

/**
 * 浏览器标签页布局
 * 用于浏览器页面的全屏展示
 */
export default function BrowserLayout() {
  return (
    <Layout style={{ height: '100%' }}>
      <Content style={{ flex: 1, overflow: 'hidden' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
