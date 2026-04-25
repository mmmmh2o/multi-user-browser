import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Tooltip,
  Empty,
  message,
  Spin,
} from 'antd';
import {
  DeleteOutlined,
  ExportOutlined,
  StarFilled,
  SearchOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.getBookmarks) {
        console.warn('electronAPI.getBookmarks 不可用');
        setBookmarks([]);
        return;
      }
      const data = await window.electronAPI.getBookmarks();
      setBookmarks(data || []);
    } catch (error) {
      console.error('加载书签失败:', error);
      message.error('加载书签失败');
      setBookmarks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteBookmark(id);
      message.success('书签已删除');
      loadBookmarks();
    } catch (error) {
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
      width: 32,
      render: (favicon) =>
        favicon ? (
          <img src={favicon} alt="" style={{ width: 16, height: 16 }} />
        ) : (
          <GlobalOutlined style={{ color: '#999' }} />
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
            if (window.electronAPI?.getBookmarks) {
              window.dispatchEvent(
                new CustomEvent('mub-navigate', { detail: { url: record.url } })
              );
            }
          }}
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
          <span style={{ color: '#999', fontSize: 12 }}>{url}</span>
        </Tooltip>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Space>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <StarFilled style={{ color: '#faad14' }} />
          <span>书签管理</span>
        </Space>
      }
      subTitle="收藏的网页，支持搜索和删除"
      extra={
        <Space>
          <Input
            placeholder="搜索书签..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
        </Space>
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
              description={
                <span>
                  暂无书签
                  <br />
                  <small style={{ color: '#999' }}>在浏览器中点击 ⭐ 收藏网页</small>
                </span>
              }
            />
          ),
        }}
      />
    </Card>
  );
}
