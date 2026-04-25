import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Progress,
  Tag,
  message,
  Popconfirm,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';

export default function DownloadManager() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('');

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getDownloads();
      setDownloads(data || []);
    } catch (error) {
      message.error('加载下载列表失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDownloads();

    // 监听下载进度
    window.electronAPI.onDownloadProgress((data) => {
      setDownloads((prev) =>
        prev.map((task) =>
          task.id === data.taskId
            ? { ...task, downloadedSize: data.downloadedSize, progress: data.progress }
            : task
        )
      );
    });

    // 监听下载完成
    window.electronAPI.onDownloadCompleted((data) => {
      message.success(`下载完成: ${data.path}`);
      loadDownloads();
    });
  }, []);

  const handleAdd = async () => {
    if (!url.trim()) {
      message.warning('请输入下载地址');
      return;
    }
    try {
      await window.electronAPI.addDownload(url, savePath || '.');
      message.success('下载任务已添加');
      setAddModalOpen(false);
      setUrl('');
      setSavePath('');
      loadDownloads();
    } catch (error) {
      message.error('添加下载失败');
    }
  };

  const handlePause = async (taskId) => {
    await window.electronAPI.pauseDownload(taskId);
    loadDownloads();
  };

  const handleResume = async (taskId) => {
    await window.electronAPI.resumeDownload(taskId);
    loadDownloads();
  };

  const handleCancel = async (taskId) => {
    await window.electronAPI.cancelDownload(taskId);
    message.success('下载已取消');
    loadDownloads();
  };

  const statusMap = {
    pending: { color: 'default', text: '等待中' },
    downloading: { color: 'processing', text: '下载中' },
    paused: { color: 'warning', text: '已暂停' },
    completed: { color: 'success', text: '已完成' },
    failed: { color: 'error', text: '失败' },
  };

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      ellipsis: true,
    },
    {
      title: '进度',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={record.progress || 0}
          size="small"
          status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '大小',
      width: 120,
      render: (_, record) => {
        const formatSize = (bytes) => {
          if (!bytes) return '-';
          const units = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(1024));
          return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
        };
        return `${formatSize(record.downloadedSize)} / ${formatSize(record.fileSize)}`;
      },
    },
    {
      title: '操作',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === 'downloading' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePause(record.id)}
            >
              暂停
            </Button>
          )}
          {record.status === 'paused' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleResume(record.id)}
            >
              恢复
            </Button>
          )}
          {record.status !== 'completed' && (
            <Popconfirm title="确定取消？" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="下载管理器"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
          新建下载
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={downloads}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title="新建下载"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        okText="开始下载"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="下载地址 (https://...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            prefix={<DownloadOutlined />}
          />
          <Input
            placeholder="保存目录（默认当前目录）"
            value={savePath}
            onChange={(e) => setSavePath(e.target.value)}
          />
        </Space>
      </Modal>
    </Card>
  );
}
