import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function NotificationBell({ darkMode }) {
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
          ...prev.slice(0, 49),
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
    if (visible && unreadCount > 0) {
      setTimeout(handleMarkAllRead, 1500);
    }
  };

  const dropdownContent = (
    <div
      className="mub-notification-dropdown"
      style={{
        width: 320,
        maxHeight: 400,
        overflow: 'auto',
        background: 'var(--mub-bg-card)',
        borderRadius: 8,
        boxShadow: 'var(--mub-shadow-dropdown)',
        padding: 8,
        border: '1px solid var(--mub-border-light)',
      }}
      role="region"
      aria-label="通知列表"
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
              borderBottom: '1px solid var(--mub-border-light)',
              marginBottom: 8,
            }}
          >
            <Text strong style={{ color: 'var(--mub-text)' }}>通知</Text>
            <a onClick={handleClear} aria-label="清空所有通知">清空</a>
          </div>
          <List
            size="small"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item style={{ padding: '4px 8px' }}>
                <Text style={{ fontSize: 12, color: 'var(--mub-text)' }}>
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
        <BellOutlined
          style={{
            fontSize: 18,
            cursor: 'pointer',
            color: darkMode ? '#fff' : 'var(--mub-text-secondary)',
          }}
          role="button"
          aria-label={`通知${unreadCount > 0 ? `，${unreadCount} 条未读` : ''}`}
        />
      </Badge>
    </Dropdown>
  );
}
