import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNotification((data) => {
        setNotifications((prev) => [
          {
            id: Date.now(),
            message: data.message,
            type: data.type || 'info',
            timestamp: data.timestamp || Date.now(),
            read: false,
          },
          ...prev.slice(0, 49), // 最多保留 50 条
        ]);
      });
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClear = () => {
    setNotifications([]);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDropdownVisibleChange = (visible) => {
    // 打开下拉时自动标记全部已读
    if (visible && unreadCount > 0) {
      setTimeout(handleMarkAllRead, 1500);
    }
  };

  const dropdownContent = (
    <div
      style={{
        width: 320,
        maxHeight: 400,
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        padding: 8,
      }}
    >
      {notifications.length === 0 ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderBottom: '1px solid #f0f0f0',
              marginBottom: 8,
            }}
          >
            <Text strong>通知</Text>
            <a onClick={handleClear}>清空</a>
          </div>
          <List
            size="small"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item style={{ padding: '4px 8px' }}>
                <Text style={{ fontSize: 12 }}>
                  {item.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(item.timestamp).toLocaleTimeString('zh-CN')}
                </Text>
              </List.Item>
            )}
          />
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={handleDropdownVisibleChange}
    >
      <Badge count={unreadCount} size="small" offset={[-4, 4]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
}
