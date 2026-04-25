import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Tag,
  Popconfirm,
  Empty,
  message,
  Tooltip,
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
import { safeCall } from '../utils/ipcHelper';

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState('file');

  const loadFiles = async (dirPath) => {
    setLoading(true);
    try {
      const result = await safeCall(
        () => window.electronAPI.getFiles(dirPath || currentPath),
        []
      );
      if (result?.error) {
        message.error(result.error);
        setFiles([]);
      } else {
        setFiles(result || []);
      }
    } catch (error) {
      console.error('加载文件列表失败:', error);
      message.error('加载文件列表失败');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentPath]);

  const handleGoUp = () => {
    const parts = currentPath.replace(/\\/g, '/').split('/');
    parts.pop();
    setCurrentPath(parts.join('/') || '');
  };

  const handleCreate = async () => {
    try {
      if (createType === 'folder') {
        await safeCall(() => window.electronAPI.createDirectory(
          `${currentPath}/${newFolderName}`.replace('//', '/')
        ));
        message.success('文件夹已创建');
      } else {
        await safeCall(() => window.electronAPI.createFile(
          `${currentPath}/${newFileName}`.replace('//', '/'),
          newFileContent
        ));
        message.success('文件已创建');
      }
      setCreateModalOpen(false);
      setNewFolderName('');
      setNewFileName('');
      setNewFileContent('');
      loadFiles();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleDelete = async (filePath) => {
    try {
      await safeCall(() => window.electronAPI.deleteFile(filePath));
      message.success('已删除');
      loadFiles();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'isDirectory',
      width: 32,
      render: (isDir) =>
        isDir ? (
          <FolderOutlined style={{ color: '#faad14' }} />
        ) : (
          <FileOutlined style={{ color: '#999' }} />
        ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      sorter: (a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      },
      render: (name, record) =>
        record.isDirectory ? (
          <a onClick={() => setCurrentPath(record.path)}>{name}</a>
        ) : (
          <span>{name}</span>
        ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (size, record) => {
        if (record.isDirectory) return '-';
        if (!size) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedAt',
      width: 160,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="重命名">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                const newName = prompt('新名称:', record.name);
                if (newName && newName !== record.name) {
                  const dir = record.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
                  safeCall(() => window.electronAPI.renameFile(record.path, `${dir}/${newName}`))
                    .then(() => { message.success('已重命名'); loadFiles(); });
                }
              }}
            />
          </Tooltip>
          <Popconfirm
            title={`确定删除 "${record.name}"？`}
            onConfirm={() => handleDelete(record.path)}
          >
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <FolderOutlined />
          <span>文件管理</span>
        </Space>
      }
      subTitle="浏览和管理文件"
      extra={
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={() => { setCreateType('folder'); setCreateModalOpen(true); }}
          >
            新建文件夹
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setCreateType('file'); setCreateModalOpen(true); }}
          >
            新建文件
          </Button>
        </Space>
      }
    >
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<HomeOutlined />} onClick={() => setCurrentPath('')}>
          根目录
        </Button>
        <Button icon={<ArrowUpOutlined />} onClick={handleGoUp} disabled={!currentPath}>
          上级
        </Button>
        <Input
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          placeholder="输入路径..."
          style={{ width: 400 }}
          onPressEnter={() => loadFiles()}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="path"
        loading={loading}
        pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 项` }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  此目录为空
                  <br />
                  <small style={{ color: '#999' }}>点击上方按钮创建文件或文件夹</small>
                </span>
              }
            />
          ),
        }}
      />

      <Modal
        title={createType === 'folder' ? '新建文件夹' : '新建文件'}
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form layout="vertical">
          {createType === 'folder' ? (
            <Form.Item label="文件夹名称" required>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="请输入文件夹名称"
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item label="文件名" required>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="请输入文件名"
                />
              </Form.Item>
              <Form.Item label="文件内容">
                <Input.TextArea
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="文件内容（可选）"
                  rows={6}
                />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
