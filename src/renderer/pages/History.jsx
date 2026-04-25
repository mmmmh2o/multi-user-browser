import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tooltip,
  Empty,
  message,
  Popconfirm,
} from 'antd';
import {
  DeleteOutlined,
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
      if (!window.electronAPI?.getHistory) {
        console.warn('electronAPI.getHistory 不可用');
        setHistory([]);
        return;
      }
      const data = await window.electronAPI.getHistory();
      setHistory(data || []);
    } catch (error) {
      console.error('加载历史失败:', error);
      message.error('加载历史记录失败');
      setHistory([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      const result = await window.electronAPI.deleteHistory?.(id);
      message.success('已删除');
      loadHistory();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleClear = async () => {
    try {
      await window.electronAPI.clearHistory();
      message.success('历史记录已清空');
      loadHistory();
    } catch (error) {
      message.error('清空失败');
    }
  };

  const filtered = history.filter(
    (h) =>
      (h.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (h.url || '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: '',
      dataIndex: 'favicon',
      width: 32,
      render: () => <GlobalOutlined style={{ color: '#999' }} />,
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
            window.dispatchEvent(
              new CustomEvent('mub-navigate', { detail: { url: record.url } })
            );
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
      title: '访问时间',
      dataIndex: 'visitedAt',
      width: 160,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 80,
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
        <Space>
          <HistoryOutlined />
          <span>历史记录</span>
        </Space>
      }
      subTitle={`最近 ${history.length} 条浏览记录`}
      extra={
        <Space>
          <Input
            placeholder="搜索历史..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
          <Popconfirm
            title="确定清空所有历史记录？"
            onConfirm={handleClear}
            okText="清空"
            cancelText="取消"
          >
            <Button icon={<ClearOutlined />} danger>
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
        pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  暂无历史记录
                  <br />
                  <small style={{ color: '#999' }}>浏览网页后会自动记录</small>
                </span>
              }
            />
          ),
        }}
      />
    </Card>
  );
}
