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
      // 应用主题
      const theme = settings?.darkMode ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
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
      // 应用主题切换
      const theme = values.darkMode ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
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
      document.documentElement.setAttribute('data-theme', 'light');
      loadSettings();
    } catch { message.error('重置失败'); }
  };

  const sectionIcon = (icon, color) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: 6, background: `${color}18`,
      color, fontSize: 13, marginRight: 6, verticalAlign: 'middle',
    }} aria-hidden="true">
      {icon}
    </span>
  );

  return (
    <Card
      title={
        <span className="mub-card-title">
          <CardIcon icon={<SettingOutlined />} color="var(--mub-text-secondary)" />
          <span>设置</span>
        </span>
      }
      extra={
        <Space>
          <Popconfirm title="确定重置所有设置为默认值？" onConfirm={handleReset} okText="重置" cancelText="取消">
            <Button icon={<UndoOutlined />} aria-label="重置为默认设置">重置默认</Button>
          </Popconfirm>
          <Button
            type="primary" icon={<SaveOutlined />}
            onClick={handleSave} loading={saving}
            aria-label="保存设置"
          >
            保存
          </Button>
        </Space>
      }
      role="region"
      aria-label="应用设置"
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('🌐', '#4f6ef7')} 浏览器
          </Divider>

          <Form.Item
            name="homepage" label="主页地址"
            extra="启动时或点击主页按钮时加载的网址"
          >
            <Input placeholder="https://www.baidu.com" size="large" aria-label="主页地址" />
          </Form.Item>

          <Form.Item name="searchEngine" label="默认搜索引擎">
            <Select
              placeholder="选择搜索引擎"
              size="large"
              options={[
                { value: 'google', label: 'Google' },
                { value: 'baidu', label: '百度' },
                { value: 'bing', label: 'Bing' },
                { value: 'duckduckgo', label: 'DuckDuckGo' },
              ]}
              aria-label="默认搜索引擎"
            />
          </Form.Item>

          <Form.Item
            name="maxHistory" label="最大历史记录数"
            extra="超过此数量的旧记录将被自动清除"
          >
            <InputNumber
              min={10} max={1000} placeholder="100"
              style={{ width: 200 }} size="large"
              aria-label="最大历史记录数"
            />
          </Form.Item>

          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('🎨', '#eb2f96')} 外观
          </Divider>

          <Form.Item
            name="darkMode" label="深色模式"
            valuePropName="checked"
            extra="切换后需点击保存生效"
          >
            <Switch
              checkedChildren="深色" unCheckedChildren="浅色"
              aria-label="深色模式开关"
            />
          </Form.Item>

          <Form.Item name="fontSize" label="字体大小">
            <Select
              placeholder="选择字体大小"
              size="large"
              options={[
                { value: 'small', label: '小' },
                { value: 'medium', label: '中（默认）' },
                { value: 'large', label: '大' },
              ]}
              aria-label="字体大小"
            />
          </Form.Item>

          <Divider orientation="left" orientationMargin={0}>
            {sectionIcon('⬇️', '#13c2c2')} 下载
          </Divider>

          <Form.Item
            name="downloadPath" label="默认下载路径"
            extra="留空则使用系统默认下载文件夹"
          >
            <Input
              placeholder="C:\Users\...\Downloads"
              size="large"
              aria-label="默认下载路径"
            />
          </Form.Item>

          <Form.Item
            name="autoClassify" label="自动分类下载文件"
            valuePropName="checked"
            extra="按文件类型自动归类到子文件夹"
          >
            <Switch
              checkedChildren="开启" unCheckedChildren="关闭"
              aria-label="自动分类下载文件"
            />
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
