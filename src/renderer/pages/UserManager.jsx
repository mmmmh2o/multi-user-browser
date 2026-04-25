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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getUsers();
      setUsers(data || []);
    } catch (error) {
      message.error('加载用户失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const user = editingUser ? { ...editingUser, ...values } : values;
      await window.electronAPI.saveUser(user);
      message.success(editingUser ? '用户已更新' : '用户已创建');
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await window.electronAPI.deleteUser(userId);
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
      // 先停用所有用户
      for (const u of users.filter((u) => u.isActive)) {
        await window.electronAPI.deactivateUser(u.id);
      }
      // 创建会话并激活
      await window.electronAPI.createSession(userId);
      await window.electronAPI.activateUser(userId);
      message.success('用户已激活，浏览器会话已隔离');
      loadUsers();
    } catch (error) {
      message.error('激活失败');
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await window.electronAPI.deactivateUser(userId);
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
        <span style={{ fontWeight: record.isActive ? 600 : 400 }}>
          {name}
        </span>
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
      render: (ts) => new Date(ts).toLocaleString('zh-CN'),
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
        pagination={{ pageSize: 10 }}
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
