import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Modal, Form, Popconfirm,
  Empty, message, Tooltip,
} from 'antd';
import {
  FolderOutlined, FileOutlined, PlusOutlined, DeleteOutlined,
  EditOutlined, ArrowUpOutlined, HomeOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import CardIcon from '../components/CardIcon';
import { DEFAULT_PAGINATION } from '../constants';
import { formatBytes, formatTime } from '../utils/format';

export default function FileManager() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState('file');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const loadFiles = async (dirPath) => {
    setLoading(true);
    try {
      const result = await safeCall(() => window.electronAPI.getFiles(dirPath || currentPath), []);
      if (result?.error) { message.error(result.error); setFiles([]); }
      else setFiles(result || []);
    } catch {
      message.error('加载文件列表失败');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFiles(); }, [currentPath]);

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
      setNewFolderName(''); setNewFileName(''); setNewFileContent('');
      loadFiles();
    } catch { message.error('创建失败'); }
  };

  const handleDelete = async (filePath) => {
    try {
      await safeCall(() => window.electronAPI.deleteFile(filePath));
      message.success('已删除');
      loadFiles();
    } catch { message.error('删除失败'); }
  };

  const handleRename = async () => {
    if (!renameValue.trim() || !renamingFile) return;
    if (renameValue === renamingFile.name) { setRenameModalOpen(false); return; }
    try {
      const dir = renamingFile.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
      await safeCall(() => window.electronAPI.renameFile(renamingFile.path, `${dir}/${renameValue}`));
      message.success('已重命名');
      setRenameModalOpen(false); setRenamingFile(null); setRenameValue('');
      loadFiles();
    } catch { message.error('重命名失败'); }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'isDirectory',
      width: 40,
      render: (isDir) => (
        <div className={`mub-table-icon${isDir ? ' mub-table-icon--folder' : ''}`}>
          {isDir ? <FolderOutlined /> : <FileOutlined />}
        </div>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      sorter: (a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      },
      render: (name, record) => record.isDirectory ? (
        <a onClick={() => setCurrentPath(record.path)} style={{ fontWeight: 500 }}>{name}</a>
      ) : (
        <span>{name}</span>
      ),
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 100,
      render: (size, record) => {
        if (record.isDirectory) return <span style={{ color: 'var(--mub-text-muted)' }}>-</span>;
        return <span>{formatBytes(size)}</span>;
      },
    },
    {
      title: '修改时间',
      dataIndex: 'modifiedAt',
      width: 150,
      render: (ts) => (
        <span style={{ color: 'var(--mub-text-secondary)', fontSize: 'var(--mub-font-size-sm)' }}>
          {formatTime(ts)}
        </span>
      ),
    },
    {
      title: '操作',
      width: 110,
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="重命名">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setRenamingFile(record); setRenameValue(record.name); setRenameModalOpen(true); }} />
          </Tooltip>
          <Popconfirm title={`确定删除 "${record.name}"？`} onConfirm={() => handleDelete(record.path)}>
            <Tooltip title="删除">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const headerExtra = (
    <div style={{ display: 'flex', gap: 'var(--mub-space-sm)' }}>
      <Button icon={<PlusOutlined />} onClick={() => { setCreateType('folder'); setCreateModalOpen(true); }}>
        新建文件夹
      </Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateType('file'); setCreateModalOpen(true); }}>
        新建文件
      </Button>
    </div>
  );

  return (
    <Card
      title={
        <span className="mub-card-title">
          <CardIcon icon={<FolderOutlined />} color="#faad14" />
          <span>文件管理</span>
        </span>
      }
      extra={headerExtra}
    >
      {/* 路径导航栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--mub-space-sm)',
        marginBottom: 'var(--mub-space-md)',
        padding: 'var(--mub-space-sm) var(--mub-space-sm)',
        background: '#fff', borderRadius: 'var(--mub-radius-sm)',
        border: '1px solid var(--mub-border-light)',
      }}>
        <Tooltip title="根目录">
          <Button type="text" size="small" icon={<HomeOutlined />}
            onClick={() => setCurrentPath('')} style={{ flexShrink: 0 }} />
        </Tooltip>
        <Tooltip title="上级目录">
          <Button type="text" size="small" icon={<ArrowUpOutlined />}
            onClick={handleGoUp} disabled={!currentPath} style={{ flexShrink: 0 }} />
        </Tooltip>
        <div style={{
          flex: 1, fontSize: 'var(--mub-font-size-base)', color: 'var(--mub-text-secondary)',
          fontFamily: 'var(--mub-font-mono)', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {currentPath || '/'}
        </div>
        <Input
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          placeholder="输入路径..."
          style={{ width: 240, flexShrink: 0 }}
          size="small"
          onPressEnter={() => loadFiles()}
        />
      </div>

      <Table
        columns={columns}
        dataSource={files}
        rowKey="path"
        loading={loading}
        pagination={DEFAULT_PAGINATION}
        locale={{
          emptyText: (
            <Empty
              description={<span>
                此目录为空<br />
                <span className="mub-empty-hint">点击上方按钮创建文件或文件夹</span>
              </span>}
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
        <Form layout="vertical" style={{ marginTop: 12 }}>
          {createType === 'folder' ? (
            <Form.Item label="文件夹名称" required>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="请输入文件夹名称" size="large" />
            </Form.Item>
          ) : (
            <>
              <Form.Item label="文件名" required>
                <Input value={newFileName} onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="请输入文件名" size="large" />
              </Form.Item>
              <Form.Item label="文件内容">
                <Input.TextArea value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)}
                  placeholder="文件内容（可选）" rows={6} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="重命名"
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => { setRenameModalOpen(false); setRenamingFile(null); }}
        okText="确认"
        cancelText="取消"
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="新名称" required>
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
              placeholder="请输入新名称" onPressEnter={handleRename} autoFocus size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
