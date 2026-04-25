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
  Empty,
  message,
  Tooltip,
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
      if (!window.electronAPI?.getScripts) {
        console.warn('electronAPI.getScripts 不可用');
        setScripts([]);
        return;
      }
      const data = await window.electronAPI.getScripts();
      setScripts(data || []);
    } catch (error) {
      console.error('加载脚本失败:', error);
      message.error('加载脚本失败');
      setScripts([]);
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

  const handleDelete = async (id) => {
    try {
      await window.electronAPI.deleteScript(id);
      message.success('脚本已删除');
      loadScripts();
    } catch (error) {
      message.error('删除失败');
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

  const handleToggleEnabled = async (script) => {
    try {
      await window.electronAPI.saveScript({
        ...script,
        enabled: !script.enabled,
      });
      message.success(script.enabled ? '已禁用' : '已启用');
      loadScripts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name) => (
        <Space>
          <CodeOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: '匹配规则',
      dataIndex: 'match',
      ellipsis: true,
      render: (match) => match || <span style={{ color: '#ccc' }}>-</span>,
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
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (ts) => (ts ? new Date(ts).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      width: 140,
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
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
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
      subTitle="管理浏览器注入脚本（Tampermonkey 兼容）"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建脚本
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
                  <small style={{ color: '#999' }}>点击"新建脚本"添加用户脚本</small>
                </span>
              }
            />
          ),
        }}
      />

      <Modal
        title={editingScript ? '编辑脚本' : '新建脚本'}
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
            <Input placeholder="例如：自动签到脚本" />
          </Form.Item>
          <Form.Item
            name="match"
            label="匹配网址"
            rules={[{ required: true, message: '请输入匹配规则' }]}
            extra="使用 @match 格式，如 https://*.example.com/*"
          >
            <Input placeholder="https://*.example.com/*" />
          </Form.Item>
          <Form.Item
            name="code"
            label="脚本代码"
            rules={[{ required: true, message: '请输入脚本代码' }]}
          >
            <Input.TextArea
              placeholder="// ==UserScript==
// @name     My Script
// @match    https://*.example.com/*
// ==/UserScript==

console.log('Hello from userscript!');"
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
