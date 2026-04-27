import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tooltip, Empty, message, Popconfirm,
} from 'antd';
import {
  DeleteOutlined, HistoryOutlined, SearchOutlined, ClearOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getHistory(), []);
      setHistory(data || []);
    } catch (error) {
      message.error('加载历史记录失败');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleDelete = async (id) => {
    try {
      await safeCall(() => window.electronAPI.deleteHistory(id));
      message.success('已删除');
      loadHistory();
    } catch {
      message.error('删除失败');
    }
  };

  const handleClear = async () => {
    try {
      await safeCall(() => window.electronAPI.clearHistory());
      message.success('历史记录已清空');
      loadHistory();
    } catch {
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
      width: 40,
      render: () => (
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--mub-bg-table-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <GlobalOutlined style={{ color: 'var(--mub-text-muted)', fontSize: 13 }} />
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
      title: '访问时间',
      dataIndex: 'visitedAt',
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
            background: '#8b5cf618', color: '#8b5cf6',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>
            <HistoryOutlined />
          </span>
          <span>历史记录</span>
        </span>
      }
      extra={
        <Space>
          <Input
            placeholder="搜索历史..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Popconfirm
            title="确定清空所有历史记录？"
            onConfirm={handleClear}
            okText="清空"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<ClearOutlined />} danger>清空</Button>
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
              description={<span>
                暂无历史记录<br />
                <span style={{ color: 'var(--mub-text-muted)', fontSize: 12 }}>
                  浏览网页后会自动记录
                </span>
              </span>}
            />
          ),
        }}
      />
    </Card>
  );
}
