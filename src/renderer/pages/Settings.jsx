import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Switch,
  Select,
  Input,
  Button,
  Divider,
  message,
  Space,
  InputNumber,
  Popconfirm,
} from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await window.electronAPI.getSettings();
      form.setFieldsValue(settings);
    } catch (error) {
      message.error('加载设置失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const result = await window.electronAPI.saveSettings(values);
      if (result.success) {
        message.success('设置已保存');
      } else {
        message.error(result.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    try {
      const result = await window.electronAPI.resetSettings();
      if (result.success) {
        form.setFieldsValue(result.settings);
        message.success('设置已重置为默认值');
      }
    } catch (error) {
      message.error('重置失败');
    }
  };

  return (
    <Card
      title="设置"
      loading={loading}
      extra={
        <Space>
          <Popconfirm title="确定重置所有设置？" onConfirm={handleReset}>
            <Button icon={<UndoOutlined />}>重置</Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          defaultDownloadPath: './downloads',
          maxHistoryItems: 100,
          autoStart: false,
          closeToTray: true,
          enableNotification: true,
          enableScripts: true,
          homePage: 'about:blank',
        }}
      >
        <Divider orientation="left">通用</Divider>

        <Form.Item
          name="homePage"
          label="主页地址"
          extra="打开新标签时的默认页面"
        >
          <Input placeholder="about:blank 或 https://..." />
        </Form.Item>

        <Space size="large">
          <Form.Item name="autoStart" label="开机自启动" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="closeToTray"
            label="关闭时最小化到托盘"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="enableNotification"
            label="启用通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Space>

        <Divider orientation="left">下载</Divider>

        <Form.Item name="defaultDownloadPath" label="默认下载目录">
          <Input placeholder="./downloads" />
        </Form.Item>

        <Divider orientation="left">浏览器</Divider>

        <Form.Item name="maxHistoryItems" label="历史记录最大条数">
          <InputNumber
            min={10}
            max={1000}
            step={50}
            style={{ width: 200 }}
          />
        </Form.Item>

        <Form.Item
          name="enableScripts"
          label="启用用户脚本"
          extra="关闭后不再注入 Tampermonkey 风格脚本"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Divider orientation="about">关于</Divider>

        <Space direction="vertical" size={4}>
          <div>
            <strong>Multi-User Browser</strong> v0.1.0
          </div>
          <div style={{ color: '#999' }}>
            Electron 28 · React 18 · Ant Design 5
          </div>
          <div style={{ color: '#999' }}>
            多用户并发管理浏览器 — 会话隔离 · 脚本注入 · 文件管理
          </div>
        </Space>
      </Form>
    </Card>
  );
}
