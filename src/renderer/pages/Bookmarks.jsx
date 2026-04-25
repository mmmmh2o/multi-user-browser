import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Empty,
  Input,
  Tag,
  Tooltip,
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
      const data = await window.electronAPI.getBookmarks();
      setBookmarks(data || []);
    } catch (error) {
      message.error('加载书签失败');
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

  const handleOpen = (url) => {
    // 通知浏览器页面打开此 URL
    window.dispatchEvent(
      new CustomEvent('mub-navigate', { detail: { url } })
    );
    message.info('已在浏览器中打开');
  };

  const filtered = bookmarks.filter(
    (b) =>
      !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.url?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: '',
      width: 32,
      render: () => <StarFilled style={{ color: '#faad14' }} />,
    },
    {
      title: '名称',
      dataIndex: 'title',
      ellipsis: true,
      render: (title, record) => (
        <a onClick={() => handleOpen(record.url)} title={record.url}>
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
          <span style={{ color: '#999', fontSize: 12 }}>
            <GlobalOutlined style={{ marginRight: 4 }} />
            {url}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
      sorter: (a, b) => (a.createdAt || 0) - (b.createdAt || 0),
    },
    {
      title: '操作',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleOpen(record.url)}
          >
            打开
          </Button>
          <Popconfirm title="确定删除此书签？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="书签管理"
      subTitle={`共 ${bookmarks.length} 个书签`}
      extra={
        <Input
          placeholder="搜索书签..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 240 }}
        />
      }
    >
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="暂无书签，在浏览器中点击 ⭐ 收藏" /> }}
      />
    </Card>
  );
}
