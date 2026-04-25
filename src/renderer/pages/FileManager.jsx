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
  Breadcrumb,
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
      if (!window.electronAPI?.getFiles) {
        console.warn('electronAPI.getFiles 不可用');
        setFiles([]);
        return;
      }
      const result = await window.electronAPI.getFiles(dirPath || currentPath);
      if (result?.error) {
        message.error(result.error);
        setFiles([]);
      } else {
        setFiles(result || []);
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      message.error('加载文件列表失败');
      setFiles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    // 初始加载用户主目录
    const home = window.electronAPI?.getHomePath?.() || '~';
    setCurrentPath(home);
    loadFiles(home);
  }, []);

  const navigateTo = (dirPath) => {
    setCurrentPath(dirPath);
    loadFiles(dirPath);
  };

  const handleGoUp = () => {
    const parent = currentPath.replace(/[/\\][^/\\]+$/, '') || currentPath;
    navigateTo(parent);
  };

  const handleDelete = async (filePath) => {
    try {
      const result = await window.electronAPI.deleteFile(filePath);
      if (result?.success) {
        message.success('已删除');
        loadFiles();
      } else {
        message.error(result?.error || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCreate = async () => {
    try {
      if (createType === 'folder') {
        if (!newFolderName.trim()) {
          message.warning('请输入文件夹名称');
          return;
        }
        const fullPath = `${currentPath}/${newFolderName}`.replace('//', '/');
        const result = await window.electronAPI.createDirectory(fullPath);
        if (result?.success) {
          message.success('文件夹已创建');
          setCreateModalOpen(false);
          setNewFolderName('');
          loadFiles();
        } else {
          message.error(result?.error || '创建失败');
        }
      } else {
        if (!newFileName.trim()) {
          message.warning('请输入文件名');
          return;
        }
        const fullPath = `${currentPath}/${newFileName}`.replace('//', '/');
        const result = await window.electronAPI.createFile(fullPath, newFileContent);
        if (result?.success) {
          message.success('文件已创建');
          setCreateModalOpen(false);
          setNewFileName('');
          setNewFileContent('');
          loadFiles();
        } else {
          message.error(result?.error || '创建失败');
        }
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'isDirectory',
      width: 32,
      render: (isDir) =>
        isDir ? (
          <FolderOutlined style={{ color: '#faad14', fontSize: 16 }} />
        ) : (
          <FileOutlined style={{ color: '#999', fontSize: 16 }} />
        ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      sorter: (a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      },
      render: (name, record) => (
        <a
          onClick={() => {
            if (record.isDirectory) {
              navigateTo(record.path);
            }
          }}
          style={{ cursor: record.isDirectory ? 'pointer' : 'default' }}
        >
          {name}
        </a>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (size, record) => {
        if (record.isDirectory) return '-';
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
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title={`确定删除 "${record.name}"？`}
          onConfirm={() => handleDelete(record.path)}
        >
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  const pathParts = currentPath.split(/[/\\]/).filter(Boolean);

  return (
    <Card
      title={
        <Space>
          <FolderOutlined />
          <span>文件管理</span>
        </Space>
      }
      subTitle="浏览和管理本地文件"
      extra={
        <Space>
          <Button
            icon={<ArrowUpOutlined />}
            onClick={handleGoUp}
            disabled={!currentPath || currentPath === '/'}
          >
            上级
          </Button>
          <Button
            icon={<HomeOutlined />}
            onClick={() => navigateTo(window.electronAPI?.getHomePath?.() || '~')}
          >
            主页
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setCreateType('file');
              setCreateModalOpen(true);
            }}
          >
            新建
          </Button>
        </Space>
      }
    >
      {/* 路径面包屑 */}
      <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 6 }}>
        <Breadcrumb
          items={pathParts.map((part, idx) => ({
            title: (
              <a onClick={() => navigateTo('/' + pathParts.slice(0, idx + 1).join('/'))}>
                {part}
              </a>
            ),
          }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="path"
        loading={loading}
        pagination={files.length > 50 ? { pageSize: 50 } : false}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  此文件夹为空
                  <br />
                  <small style={{ color: '#999' }}>点击"新建"创建文件或文件夹</small>
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
          <Form.Item label="类型">
            <Space>
              <Button
                type={createType === 'file' ? 'primary' : 'default'}
                onClick={() => setCreateType('file')}
              >
                文件
              </Button>
              <Button
                type={createType === 'folder' ? 'primary' : 'default'}
                onClick={() => setCreateType('folder')}
              >
                文件夹
              </Button>
            </Space>
          </Form.Item>
          <Form.Item
            label={createType === 'folder' ? '文件夹名' : '文件名'}
            required
          >
            <Input
              value={createType === 'folder' ? newFolderName : newFileName}
              onChange={(e) =>
                createType === 'folder'
                  ? setNewFolderName(e.target.value)
                  : setNewFileName(e.target.value)
              }
              placeholder={
                createType === 'folder' ? '请输入文件夹名' : '请输入文件名'
              }
            />
          </Form.Item>
          {createType === 'file' && (
            <Form.Item label="内容">
              <Input.TextArea
                value={newFileContent}
                onChange={(e) => setNewFileContent(e.target.value)}
                placeholder="文件内容（可选）"
                rows={4}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Card>
  );
}
