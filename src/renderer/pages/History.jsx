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
  Tooltip,
} from 'antd';
import {
  DeleteOutlined,
  ExportOutlined,
  HistoryOutlined,
  SearchOutlined,
  ClearOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getHistory();
      setHistory(data || []);
    } catch (error) {
      message.error('加载历史记录失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    try {
      await window.electronAPI.clearHistory();
      message.success('历史记录已清空');
      setHistory([]);
    } catch (error) {
      message.error('清空失败');
    }
  };

  const handleOpen = (url) => {
    window.dispatchEvent(
      new CustomEvent('mub-navigate', { detail: { url } })
    );
    message.info('已在浏览器中打开');
  };

  const filtered = history.filter(
    (h) =>
      !search ||
      h.title?.toLowerCase().includes(search.toLowerCase()) ||
      h.url?.toLowerCase().includes(search.toLowerCase())
  );

  // 按日期分组
  const groupByDate = (items) => {
    const groups = {};
    for (const item of items) {
      const date = item.visitedAt
        ? new Date(item.visitedAt).toLocaleDateString('zh-CN')
        : '未知日期';
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return groups;
  };

  const columns = [
    {
      title: '',
      width: 32,
      render: () => <HistoryOutlined style={{ color: '#999' }} />,
    },
    {
      title: '页面',
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
      title: '访问时间',
      dataIndex: 'visitedAt',
      width: 180,
      render: (ts) =>
        ts ? new Date(ts).toLocaleString('zh-CN') : '-',
      sorter: (a, b) => (a.visitedAt || 0) - (b.visitedAt || 0),
      defaultSortOrder: 'descend',
    },
    {
      title: '操作',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<ExportOutlined />}
          onClick={() => handleOpen(record.url)}
        >
          打开
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="浏览历史"
      subTitle={`最近 ${history.length} 条记录`}
      extra={
        <Space>
          <Input
            placeholder="搜索历史..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 240 }}
          />
          <Popconfirm
            title="确定清空所有历史记录？"
            onConfirm={handleClear}
          >
            <Button danger icon={<ClearOutlined />}>
              清空
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 30 }}
        locale={{
          emptyText: <Empty description="暂无浏览历史" />,
        }}
      />
    </Card>
  );
}
