import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Popconfirm, message } from 'antd';
import {
  HistoryOutlined, DeleteOutlined, ClearOutlined, GlobalOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import CrudTablePage from '../components/CrudTablePage';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getHistory(), []);
      setHistory(data || []);
    } catch {
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

  const columns = [
    {
      title: '',
      dataIndex: 'favicon',
      width: 40,
      render: () => (
        <div className="mub-table-icon">
          <GlobalOutlined />
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
      title: '访问时间',
      dataIndex: 'visitedAt',
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

  const clearButton = (
    <Popconfirm
      title="确定清空所有历史记录？"
      onConfirm={handleClear}
      okText="清空"
      cancelText="取消"
      okButtonProps={{ danger: true }}
    >
      <Button icon={<ClearOutlined />} danger>清空</Button>
    </Popconfirm>
  );

  return (
    <CrudTablePage
      title="历史记录"
      icon={<HistoryOutlined />}
      iconColor="#8b5cf6"
      columns={columns}
      dataSource={history}
      loading={loading}
      searchFields={['title', 'url']}
      searchPlaceholder="搜索历史..."
      headerExtra={clearButton}
      emptyText="暂无历史记录"
      emptyHint="浏览网页后会自动记录"
    />
  );
}
