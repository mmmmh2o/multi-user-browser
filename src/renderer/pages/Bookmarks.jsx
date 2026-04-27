import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tooltip, Empty, message,
} from 'antd';
import {
  DeleteOutlined, StarFilled, SearchOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getBookmarks(), []);
      setBookmarks(data || []);
    } catch (error) {
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

  const filtered = bookmarks.filter(
    (b) =>
      (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.url || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: '',
      dataIndex: 'favicon',
      width: 40,
      render: (favicon) => (
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--mub-bg-table-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {favicon
            ? <img src={favicon} alt="" style={{ width: 16, height: 16 }} />
            : <GlobalOutlined style={{ color: 'var(--mub-text-muted)', fontSize: 13 }} />
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
          <span style={{ color: 'var(--mub-text-muted)', fontSize: 12 }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (ts) => (
        <span style={{ color: 'var(--mub-text-secondary)', fontSize: 12.5 }}>
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
    <Card
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#faad1418', color: '#faad14',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>
            <StarFilled />
          </span>
          <span>书签</span>
        </span>
      }
      extra={
        <Input
          placeholder="搜索书签..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
      }
    >
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        locale={{
          emptyText: (
            <Empty
              description={<span>
                暂无书签<br />
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  在浏览器中点击 ⭐ 收藏网页
                </span>
              </span>}
            />
          ),
        }}
      />
    </Card>
  );
}
