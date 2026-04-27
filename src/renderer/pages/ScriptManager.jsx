import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Space, Switch,
  Popconfirm, Empty, message, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CodeOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import CardIcon from '../components/CardIcon';

export default function ScriptManager() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [form] = Form.useForm();

  const loadScripts = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getScripts(), []);
      setScripts(data || []);
    } catch {
      message.error('加载脚本失败');
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadScripts(); }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const script = editingScript ? { ...editingScript, ...values } : values;
      await safeCall(() => window.electronAPI.saveScript(script));
      message.success(editingScript ? '脚本已更新' : '脚本已创建');
      setModalOpen(false); form.resetFields(); setEditingScript(null);
      loadScripts();
    } catch { message.error('保存失败'); }
  };

  const handleDelete = async (id) => {
    try {
      await safeCall(() => window.electronAPI.deleteScript(id));
      message.success('脚本已删除');
      loadScripts();
    } catch { message.error('删除失败'); }
  };

  const handleToggle = async (script) => {
    try {
      await safeCall(() => window.electronAPI.saveScript({ ...script, enabled: !script.enabled }));
      loadScripts();
    } catch { message.error('切换失败'); }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: '匹配',
      dataIndex: 'match',
      ellipsis: true,
      render: (match) => match
        ? <code style={{ fontSize: 12, background: 'var(--mub-bg-table-hover)', padding: '2px 6px', borderRadius: 4 }}>{match}</code>
        : <span style={{ color: 'var(--mub-text-muted)' }}>全部页面</span>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 90,
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
      width: 150,
      render: (ts) => (
        <span style={{ color: 'var(--mub-text-secondary)', fontSize: 12.5 }}>
          {ts ? new Date(ts).toLocaleString('zh-CN') : '-'}
        </span>
      ),
    },
    {
      title: '操作',
      width: 120,
      align: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setEditingScript(record); form.setFieldsValue(record); setModalOpen(true); }} />
          </Tooltip>
          <Popconfirm title="确定删除此脚本？" onConfirm={() => handleDelete(record.id)}>
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
        <span className="mub-card-title">
          <CardIcon icon={<CodeOutlined />} color="#2f54eb" />
          <span>脚本管理</span>
        </span>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingScript(null); form.resetFields(); setModalOpen(true);
        }}>
          添加脚本
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={scripts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
        locale={{
          emptyText: (
            <Empty
              description={<span>
                暂无脚本<br />
                <span className="mub-empty-hint">添加 UserScript 增强浏览器功能</span>
              </span>}
            />
          ),
        }}
      />

      <Modal
        title={editingScript ? '编辑脚本' : '添加脚本'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingScript(null); }}
        okText="保存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label="脚本名称"
            rules={[{ required: true, message: '请输入脚本名称' }]}>
            <Input placeholder="请输入脚本名称" size="large" />
          </Form.Item>
          <Form.Item name="match" label="匹配规则"
            extra="留空则对所有页面生效，支持 * 通配符">
            <Input placeholder="https://example.com/*" />
          </Form.Item>
          <Form.Item name="code" label="脚本代码"
            rules={[{ required: true, message: '请输入脚本代码' }]}>
            <Input.TextArea
              placeholder={`// ==UserScript==\n// @name     My Script\n// @match    https://example.com/*\n// ==/UserScript==\n\nconsole.log('Hello!');`}
              rows={12}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
