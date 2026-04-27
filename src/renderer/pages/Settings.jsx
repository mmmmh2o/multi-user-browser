import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Switch, Select, Button, Space, Divider,
  message, Spin, InputNumber, Popconfirm,
} from 'antd';
import { SaveOutlined, UndoOutlined, SettingOutlined } from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import CardIcon from '../components/CardIcon';

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await safeCall(() => window.electronAPI?.getSettings(), {});
      form.setFieldsValue(settings || {});
    } catch {
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      await safeCall(() => window.electronAPI.saveSettings(values));
      message.success('设置已保存');
      window.dispatchEvent(new CustomEvent('mub-settings-changed', { detail: values }));
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await safeCall(() => window.electronAPI.resetSettings());
      message.success('设置已重置');
      loadSettings();
    } catch { message.error('重置失败'); }
  };

  const sectionIcon = (icon, color) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: 'var(--mub-radius-xs)',
      background: `${color}18`,
      color, fontSize: 'var(--mub-font-size-base)',
      marginRight: 'var(--mub-space-xs)',
      verticalAlign: 'middle',
    }}>
      {icon}
    </span>
  );

  return (
    <Card
      title={
        <span className="mub-card-title">
          <CardIcon icon={<SettingOutlined />} color="#6b7280" />
          <span>设置</span>
        </span>
      }
      extra={
        <Space>
          <Popconfirm title="确定重置所有设置为默认值？" onConfirm={handleReset} okText="重置" cancelText="取消">
            <Button icon={<UndoOutlined />}>重置默认</Button>
          </Popconfirm>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
            保存
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('🌐', 'var(--mub-primary)')} 浏览器
          </Divider>

          <Form.Item name="homepage" label="主页地址"
            extra="启动时或点击主页按钮时加载的网址">
            <Input placeholder="https://www.baidu.com" size="large" />
          </Form.Item>

          <Form.Item name="searchEngine" label="默认搜索引擎">
            <Select placeholder="选择搜索引擎" size="large" options={[
              { value: 'google', label: 'Google' },
              { value: 'baidu', label: '百度' },
              { value: 'bing', label: 'Bing' },
              { value: 'duckduckgo', label: 'DuckDuckGo' },
            ]} />
          </Form.Item>

          <Form.Item name="maxHistory" label="最大历史记录数"
            extra="超过此数量的旧记录将被自动清除">
            <InputNumber min={10} max={1000} placeholder="100" style={{ width: 200 }} size="large" />
          </Form.Item>

          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('🎨', '#eb2f96')} 外观
          </Divider>

          <Form.Item name="darkMode" label="深色模式" valuePropName="checked">
            <Switch checkedChildren="深色" unCheckedChildren="浅色" />
          </Form.Item>

          <Form.Item name="fontSize" label="字体大小">
            <Select placeholder="选择字体大小" size="large" options={[
              { value: 'small', label: '小' },
              { value: 'medium', label: '中（默认）' },
              { value: 'large', label: '大' },
            ]} />
          </Form.Item>

          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('⬇️', '#13c2c2')} 下载
          </Divider>

          <Form.Item name="downloadPath" label="默认下载路径"
            extra="留空则使用系统默认下载文件夹">
            <Input placeholder="C:\Users\...\Downloads" size="large" />
          </Form.Item>

          <Form.Item name="autoClassify" label="自动分类下载文件"
            valuePropName="checked" extra="按文件类型自动归类到子文件夹">
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
