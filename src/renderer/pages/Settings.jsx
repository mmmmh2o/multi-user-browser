import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Space,
  Divider,
  message,
  Spin,
  InputNumber,
  Popconfirm,
} from 'antd';
import { SaveOutlined, UndoOutlined, SettingOutlined } from '@ant-design/icons';

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      if (!window.electronAPI?.getSettings) {
        console.warn('electronAPI.getSettings 不可用');
        return;
      }
      const settings = await window.electronAPI.getSettings();
      form.setFieldsValue(settings || {});
    } catch (error) {
      console.error('加载设置失败:', error);
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
      await window.electronAPI.saveSettings(values);
      message.success('设置已保存');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存失败');
    }
    setSaving(false);
  };

  const handleReset = async () => {
    try {
      await window.electronAPI.resetSettings();
      message.success('设置已重置');
      loadSettings();
    } catch (error) {
      message.error('重置失败');
    }
  };

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>设置</span>
        </Space>
      }
      subTitle="应用配置和偏好"
      extra={
        <Space>
          <Popconfirm
            title="确定重置所有设置为默认值？"
            onConfirm={handleReset}
            okText="重置"
            cancelText="取消"
          >
            <Button icon={<UndoOutlined />}>重置默认</Button>
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
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
          <Divider orientation="left">浏览器</Divider>

          <Form.Item
            name="homepage"
            label="主页地址"
            extra="启动时或点击主页按钮时加载的网址"
          >
            <Input placeholder="https://www.baidu.com" />
          </Form.Item>

          <Form.Item
            name="searchEngine"
            label="默认搜索引擎"
          >
            <Select
              placeholder="选择搜索引擎"
              options={[
                { value: 'google', label: 'Google' },
                { value: 'baidu', label: '百度' },
                { value: 'bing', label: 'Bing' },
                { value: 'duckduckgo', label: 'DuckDuckGo' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="maxHistory"
            label="最大历史记录数"
            extra="超过此数量的旧记录将被自动清除"
          >
            <InputNumber min={10} max={1000} placeholder={100} style={{ width: 200 }} />
          </Form.Item>

          <Divider orientation="left">外观</Divider>

          <Form.Item
            name="darkMode"
            label="深色模式"
            valuePropName="checked"
          >
            <Switch checkedChildren="深色" unCheckedChildren="浅色" />
          </Form.Item>

          <Form.Item
            name="fontSize"
            label="字体大小"
          >
            <Select
              placeholder="选择字体大小"
              options={[
                { value: 'small', label: '小' },
                { value: 'medium', label: '中（默认）' },
                { value: 'large', label: '大' },
              ]}
            />
          </Form.Item>

          <Divider orientation="left">下载</Divider>

          <Form.Item
            name="downloadPath"
            label="默认下载路径"
            extra="留空则使用系统默认下载文件夹"
          >
            <Input placeholder="C:\Users\...\Downloads" />
          </Form.Item>

          <Form.Item
            name="autoClassify"
            label="自动分类下载文件"
            valuePropName="checked"
            extra="按文件类型自动归类到子文件夹"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
        </Form>
      </Spin>
    </Card>
  );
}
