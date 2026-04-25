import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Progress,
  Empty,
  message,
  Tooltip,
  Popconfirm,
  Modal,
  Form,
} from 'antd';
import {
  PlusOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

export default function DownloadManager() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('');

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const data = await safeCall(
        window.electronAPI?.getDownloads,
        []
      );
      setDownloads(data || []);
    } catch (error) {
      console.error('加载下载列表失败:', error);
      message.error('加载下载列表失败');
      setDownloads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDownloads();
    window.electronAPI?.onDownloadProgress?.((data) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
    });
    window.electronAPI?.onDownloadCompleted?.((data) => {
      setDownloads((prev) =>
        prev.map((d) => (d.id === data.id ? { ...d, ...data } : d))
      );
      message.success(`下载完成: ${data.filename || data.url}`);
    });
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) {
      message.warning('请输入下载链接');
      return;
    }
    try {
      await safeCall(() => window.electronAPI.addDownload(url, savePath || undefined));
      message.success('下载任务已添加');
      setAddModalOpen(false);
      setUrl('');
      setSavePath('');
      loadDownloads();
    } catch (error) {
      message.error('添加下载失败');
    }
  };

  const handlePause = async (id) => {
    try {
      await safeCall(() => window.electronAPI.pauseDownload(id));
      loadDownloads();
    } catch (error) {
      message.error('暂停失败');
    }
  };

  const handleResume = async (id) => {
    try {
      await safeCall(() => window.electronAPI.resumeDownload(id));
      loadDownloads();
    } catch (error) {
      message.error('恢复失败');
    }
  };

  const handleCancel = async (id) => {
    try {
      await safeCall(() => window.electronAPI.cancelDownload(id));
      message.success('已取消');
      loadDownloads();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const statusMap = {
    downloading: { color: 'processing', text: '下载中' },
    paused: { color: 'warning', text: '已暂停' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '失败' },
    cancelled: { color: 'default', text: '已取消' },
    pending: { color: 'default', text: '等待中' },
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      ellipsis: true,
      render: (name, record) => name || record.url,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 160,
      render: (progress, record) => {
        const status = record.status || 'pending';
        const percent = Math.round(progress || 0);
        return (
          <Progress
            percent={percent}
            size="small"
            status={status === 'failed' ? 'exception' : status === 'completed' ? 'success' : 'active'}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || statusMap.pending;
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '大小',
      dataIndex: 'totalSize',
      width: 100,
      render: (size) => {
        if (!size) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => {
        const status = record.status || 'pending';
        return (
          <Space>
            {status === 'downloading' && (
              <Tooltip title="暂停">
                <Button
                  type="text"
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={() => handlePause(record.id)}
                />
              </Tooltip>
            )}
            {status === 'paused' && (
              <Tooltip title="继续">
                <Button
                  type="text"
                  size="small"
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleResume(record.id)}
                />
              </Tooltip>
            )}
            {['downloading', 'paused', 'pending'].includes(status) && (
              <Popconfirm title="确定取消此下载？" onConfirm={() => handleCancel(record.id)}>
                <Tooltip title="取消">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <Space>
          <DownloadOutlined />
          <span>下载管理</span>
        </Space>
      }
      subTitle="管理下载任务"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
        >
          新建下载
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={downloads}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个任务` }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  暂无下载任务
                  <br />
                  <small style={{ color: '#999' }}>点击"新建下载"添加任务</small>
                </span>
              }
            />
          ),
        }}
      />

      <Modal
        title="新建下载"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        okText="开始下载"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="下载链接" required>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.zip"
            />
          </Form.Item>
          <Form.Item label="保存路径（可选）">
            <Input
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              placeholder="默认保存到 Downloads 文件夹"
              prefix={<FolderOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
