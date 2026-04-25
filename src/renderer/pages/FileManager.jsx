import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Breadcrumb,
  Space,
  Modal,
  Input,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ArrowUpOutlined,
  HomeOutlined,
} from '@ant-design/icons';

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);

  const loadFiles = async (dirPath) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getFiles(dirPath || currentPath);
      if (result.error) {
        message.error(result.error);
        setFiles([]);
      } else {
        setFiles(result);
      }
    } catch (error) {
      message.error('加载文件列表失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    // 默认打开用户目录
    const homePath = window.electronAPI ? '~' : '';
    setCurrentPath(homePath);
    loadFiles(homePath);
  }, []);

  const handleNavigate = (dirPath) => {
    setCurrentPath(dirPath);
    loadFiles(dirPath);
  };

  const handleUp = () => {
    const parentPath = currentPath.replace(/[/\\][^/\\]+$/, '') || '/';
    handleNavigate(parentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const fullPath = `${currentPath}/${newFolderName}`;
    const result = await window.electronAPI.createDirectory(fullPath);
    if (result.success) {
      message.success('文件夹已创建');
      setFolderModalOpen(false);
      setNewFolderName('');
      loadFiles();
    } else {
      message.error(result.error);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const fullPath = `${currentPath}/${newFileName}`;
    const result = await window.electronAPI.createFile(fullPath, newFileContent);
    if (result.success) {
      message.success('文件已创建');
      setFileModalOpen(false);
      setNewFileName('');
      setNewFileContent('');
      loadFiles();
    } else {
      message.error(result.error);
    }
  };

  const handleDelete = async (filePath) => {
    const result = await window.electronAPI.deleteFile(filePath);
    if (result.success) {
      message.success('已删除');
      loadFiles();
    } else {
      message.error(result.error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name, record) => (
        <a
          onClick={() => record.isDirectory && handleNavigate(record.path)}
          style={{ cursor: record.isDirectory ? 'pointer' : 'default' }}
        >
          {record.isDirectory ? (
            <FolderOutlined style={{ color: '#faad14', marginRight: 8 }} />
          ) : (
            <FileOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          )}
          {name}
        </a>
      ),
      sorter: (a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (size, record) => (record.isDirectory ? '-' : formatSize(size)),
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: '类型',
      dataIndex: 'extension',
      width: 100,
      render: (ext, record) =>
        record.isDirectory ? (
          <Tag color="blue">文件夹</Tag>
        ) : (
          <Tag>{ext || '未知'}</Tag>
        ),
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedAt',
      width: 180,
      render: (ts) => new Date(ts).toLocaleString('zh-CN'),
      sorter: (a, b) => a.modifiedAt - b.modifiedAt,
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.path)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Button size="small" icon={<HomeOutlined />} onClick={() => handleNavigate('~')} />
          <Button size="small" icon={<ArrowUpOutlined />} onClick={handleUp} />
          <Breadcrumb
            items={currentPath
              .split(/[/\\]/)
              .filter(Boolean)
              .map((part, i, arr) => ({
                title: part,
                onClick: () => handleNavigate(arr.slice(0, i + 1).join('/')),
              }))}
          />
        </Space>
      }
      extra={
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setFolderModalOpen(true)}>
            新建文件夹
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setFileModalOpen(true)}>
            新建文件
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={files}
        rowKey="path"
        loading={loading}
        pagination={false}
        size="small"
      />

      <Modal
        title="新建文件夹"
        open={folderModalOpen}
        onOk={handleCreateFolder}
        onCancel={() => setFolderModalOpen(false)}
      >
        <Input
          placeholder="文件夹名称"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
      </Modal>

      <Modal
        title="新建文件"
        open={fileModalOpen}
        onOk={handleCreateFile}
        onCancel={() => setFileModalOpen(false)}
      >
        <Input
          placeholder="文件名"
          value={newFileName}
          onChange={(e) => setNewFileName(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Input.TextArea
          placeholder="文件内容（可选）"
          value={newFileContent}
          onChange={(e) => setNewFileContent(e.target.value)}
          rows={6}
        />
      </Modal>
    </Card>
  );
}
