import React, { useState, useEffect } from 'react';
import { Button, Tooltip, message } from 'antd';
import { StarFilled, GlobalOutlined, DeleteOutlined } from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import CrudTablePage from '../components/CrudTablePage';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getBookmarks(), []);
      setBookmarks(data || []);
    } catch {
      message.error('加载书签失败');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookmarks(); }, []);

  const handleDelete = async (id) => {
    try {
      await safeCall(() => window.electronAPI.deleteBookmark(id));
      message.success('书签已删除');
      loadBookmarks();
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'favicon',
      width: 40,
      render: (favicon) => (
        <div className="mub-table-icon">
          {favicon
            ? <img src={favicon} alt="" style={{ width: 16, height: 16 }} />
            : <GlobalOutlined />
          }
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      render: (title, record) => (
        <a
          href={record.url}
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('mub-navigate', { detail: { url: record.url } }));
          }}
          style={{ fontWeight: 500, color: 'var(--mub-text)' }}
        >
          {title || record.url}
        </a>
      ),
    },
    {
      title: '网址',
      dataIndex: 'url',
      ellipsis: true,
      render: (url) => (
        <Tooltip title={url}>
          <span style={{ color: 'var(--mub-text-muted)', fontSize: 'var(--mub-font-size-sm)' }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (ts) => (
        <span style={{ color: 'var(--mub-text-secondary)', fontSize: 'var(--mub-font-size-sm)' }}>
          {ts ? new Date(ts).toLocaleString('zh-CN') : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 70,
      align: 'right',
      render: (_, record) => (
        <Tooltip title="删除">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <CrudTablePage
      title="书签"
      icon={<StarFilled />}
      iconColor="#faad14"
      columns={columns}
      dataSource={bookmarks}
      loading={loading}
      searchFields={['title', 'url']}
      searchPlaceholder="搜索书签..."
      emptyText="暂无书签"
      emptyHint="在浏览器中点击 ⭐ 收藏网页"
    />
  );
}
