import React, { useState } from 'react';
import { Card, Tabs, Input, Button, Space, Empty } from 'antd';
import { PlusOutlined, CloseOutlined, ReloadOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Search } = Input;

export default function Browser() {
  const [tabs, setTabs] = useState([
    { key: '1', title: '新标签页', url: 'about:blank' },
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [address, setAddress] = useState('');

  const handleNavigate = (url) => {
    let targetUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
      targetUrl = `https://${url}`;
    }
    setTabs((prev) =>
      prev.map((tab) =>
        tab.key === activeTab ? { ...tab, url: targetUrl, title: url } : tab
      )
    );
    setAddress(targetUrl);
  };

  const addTab = () => {
    const newKey = String(Date.now());
    setTabs((prev) => [...prev, { key: newKey, title: '新标签页', url: 'about:blank' }]);
    setActiveTab(newKey);
    setAddress('');
  };

  const closeTab = (targetKey) => {
    if (tabs.length === 1) return;
    const filtered = tabs.filter((tab) => tab.key !== targetKey);
    setTabs(filtered);
    if (activeTab === targetKey) {
      setActiveTab(filtered[filtered.length - 1].key);
    }
  };

  const currentTab = tabs.find((t) => t.key === activeTab);

  return (
    <Card bodyStyle={{ padding: 0 }} style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      {/* 标签栏 */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', padding: '4px 8px' }}>
        <Tabs
          type="editable-card"
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          onEdit={(targetKey, action) => {
            if (action === 'add') addTab();
            if (action === 'remove') closeTab(targetKey);
          }}
          items={tabs.map((tab) => ({
            key: tab.key,
            label: tab.title,
            closable: tabs.length > 1,
          }))}
          style={{ flex: 1, marginBottom: 0 }}
        />
      </div>

      {/* 地址栏 */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 8, borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button size="small" icon={<ArrowLeftOutlined />} />
          <Button size="small" icon={<ArrowRightOutlined />} />
          <Button size="small" icon={<ReloadOutlined />} onClick={() => handleNavigate(currentTab?.url || '')} />
        </Space>
        <Search
          placeholder="输入网址或搜索..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onSearch={handleNavigate}
          enterButton="前往"
          style={{ flex: 1 }}
          size="small"
        />
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        {currentTab?.url && currentTab.url !== 'about:blank' ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48 }}>🌐</div>
            <div style={{ color: '#999' }}>
              浏览器功能开发中...
            </div>
            <div style={{ color: '#bbb', fontSize: 12 }}>
              目标地址: {currentTab.url}
            </div>
          </div>
        ) : (
          <Empty description="在地址栏输入网址开始浏览" />
        )}
      </div>
    </Card>
  );
}
