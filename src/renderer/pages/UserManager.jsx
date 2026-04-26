import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tag,
  Popconfirm,
  message,
  Avatar,
  Tooltip,
  Badge,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await safeCall(
        () => window.electronAPI.getUsers(),
        []
      );
      setUsers(data || []);
    } catch (error) {
      console.error('[UserManager] 加载用户失败:', error);
      message.error('加载用户失败');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (validationError) {
      console.warn('[UserManager] 表单校验失败:', validationError);
      return;
    }

    // 诊断：检查 electronAPI 是否可用
    if (!window.electronAPI) {
      console.error('[UserManager] window.electronAPI 未定义 — preload 脚本可能未加载');
      console.error('[UserManager] __MUB_PRELOAD_READY__:', window.__MUB_PRELOAD_READY__);
      message.error('保存失败：主进程未就绪，请重启应用');
      return;
    }

    const user = editingUser ? { ...editingUser, ...values } : values;

    try {
      const result = await safeCall(() => window.electronAPI.saveUser(user));

      if (result === null || result === undefined) {
        console.error('[UserManager] saveUser 返回 null — IPC 调用失败或主进程 handler 异常');
        message.error('保存失败：主进程响应异常，请查看控制台日志');
        return;
      }

      message.success(editingUser ? '用户已更新' : '用户已创建');
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('[UserManager] 保存用户异常:', error);
      message.error(`保存失败：${error?.message || '未知错误'}`);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await safeCall(() => window.electronAPI.deleteUser(userId));
      message.success('用户已删除');
      loadUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleActivate = async (userId) => {
    try {
      for (const u of users.filter((u) => u.isActive)) {
        await safeCall(() => window.electronAPI.deactivateUser(u.id));
      }
      await safeCall(() => window.electronAPI.createSession(userId));
      await safeCall(() => window.electronAPI.activateUser(userId));
      message.success('用户已激活，浏览器会话已隔离');
      loadUsers();
    } catch (error) {
      message.error('激活失败');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await safeCall(() => window.electronAPI.deactivateUser(userId));
      message.success('用户已停用');
      loadUsers();
    } catch (error) {
      message.error('停用失败');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'avatar',
      width: 48,
      render: (avatar, record) => (
        <Badge dot status={record.isActive ? 'success' : 'default'} offset={[-4, 4]}>
          <Avatar src={avatar} icon={<UserOutlined />} />
        </Badge>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <span style={{ fontWeight: record.isActive ? 600 : 400 }}>{name}</span>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: (email) => email || <span style={{ color: '#ccc' }}>-</span>,
    },
    {
      title: '会话状态',
      dataIndex: 'isActive',
      width: 120,
      render: (active) => (
        <Tag color={active ? 'green' : 'default'} icon={active ? <CheckCircleOutlined /> : null}>
          {active ? '活跃' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
      sorter: (a, b) => a.createdAt - b.createdAt,
    },
    {
      title: '操作',
      width: 260,
      render: (_, record) => (
        <Space>
          {record.isActive ? (
            <Tooltip title="停用后释放会话资源">
              <Button
                type="link"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleDeactivate(record.id)}
              >
                停用
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => handleActivate(record.id)}
            >
              激活
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此用户？"
            description="关联的会话数据将被清除"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      subTitle="管理浏览器用户，每个用户拥有独立的会话隔离"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加用户
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个用户` }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  暂无用户
                  <br />
                  <small style={{ color: '#999' }}>点击"添加用户"创建第一个用户</small>
                </span>
              }
            />
          ),
        }}
      />

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingUser(null);
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱' }]}
          >
            <Input placeholder="请输入邮箱（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
