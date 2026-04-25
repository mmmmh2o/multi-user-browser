import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons';

export default function ScriptManager() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [form] = Form.useForm();

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getScripts();
      setScripts(data || []);
    } catch (error) {
      message.error('加载脚本失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const script = editingScript ? { ...editingScript, ...values } : values;
      await window.electronAPI.saveScript(script);
      message.success(editingScript ? '脚本已更新' : '脚本已创建');
      setModalOpen(false);
      form.resetFields();
      setEditingScript(null);
      loadScripts();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (scriptId) => {
    await window.electronAPI.deleteScript(scriptId);
    message.success('脚本已删除');
    loadScripts();
  };

  const handleEdit = (script) => {
    setEditingScript(script);
    form.setFieldsValue(script);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingScript(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleToggleEnabled = async (script) => {
    await window.electronAPI.saveScript({
      ...script,
      enabled: !script.enabled,
    });
    loadScripts();
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name) => (
        <span>
          <CodeOutlined style={{ marginRight: 8, color: '#1677ff' }} />
          {name}
        </span>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      ellipsis: true,
      render: (url) => url || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          size="small"
          onChange={() => handleToggleEnabled(record)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
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
      title="脚本管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加脚本
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={scripts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingScript ? '编辑脚本' : '添加脚本'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingScript(null);
        }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="脚本名称"
            rules={[{ required: true, message: '请输入脚本名称' }]}
          >
            <Input placeholder="例如：自动登录脚本" />
          </Form.Item>
          <Form.Item name="url" label="脚本 URL">
            <Input placeholder="https://greasyfork.org/scripts/xxx.user.js（可选）" />
          </Form.Item>
          <Form.Item name="code" label="脚本代码">
            <Input.TextArea
              placeholder="// ==UserScript==..."
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
