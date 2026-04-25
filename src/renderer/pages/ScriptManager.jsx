import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Switch,
  Popconfirm,
  Empty,
  message,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';

export default function ScriptManager() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [form] = Form.useForm();

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await safeCall(
        window.electronAPI?.getScripts,
        []
      );
      setScripts(data || []);
    } catch (error) {
      console.error('加载脚本失败:', error);
      message.error('加载脚本失败');
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScripts();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const script = editingScript ? { ...editingScript, ...values } : values;
      await safeCall(() => window.electronAPI.saveScript(script));
      message.success(editingScript ? '脚本已更新' : '脚本已创建');
      setModalOpen(false);
      form.resetFields();
      setEditingScript(null);
      loadScripts();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await safeCall(() => window.electronAPI.deleteScript(id));
      message.success('脚本已删除');
      loadScripts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleToggle = async (script) => {
    try {
      await safeCall(() => window.electronAPI.saveScript({
        ...script,
        enabled: !script.enabled,
      }));
      loadScripts();
    } catch (error) {
      message.error('切换失败');
    }
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

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name) => <strong>{name}</strong>,
    },
    {
      title: '匹配',
      dataIndex: 'match',
      ellipsis: true,
      render: (match) => match || <span style={{ color: '#ccc' }}>全部页面</span>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          size="small"
          onChange={() => handleToggle(record)}
        />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 160,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此脚本？"
            onConfirm={() => handleDelete(record.id)}
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
          <CodeOutlined />
          <span>脚本管理</span>
        </Space>
      }
      subTitle="管理 UserScript 脚本"
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
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 个脚本` }}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  暂无脚本
                  <br />
                  <small style={{ color: '#999' }}>添加 UserScript 增强浏览器功能</small>
                </span>
              }
            />
          ),
        }}
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
            <Input placeholder="请输入脚本名称" />
          </Form.Item>
          <Form.Item
            name="match"
            label="匹配规则"
            extra="留空则对所有页面生效，支持 * 通配符"
          >
            <Input placeholder="https://example.com/*" />
          </Form.Item>
          <Form.Item
            name="code"
            label="脚本代码"
            rules={[{ required: true, message: '请输入脚本代码' }]}
          >
            <Input.TextArea
              placeholder={`// ==UserScript==\n// @name     My Script\n// @match    https://example.com/*\n// ==/UserScript==\n\nconsole.log('Hello!');`}
              rows={12}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
