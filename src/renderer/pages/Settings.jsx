import React from 'react';
import { Card, Form, Switch, Select, Input, Button, Divider, message, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

export default function Settings() {
  const [form] = Form.useForm();

  const handleSave = () => {
    message.success('设置已保存');
  };

  return (
    <Card title="设置" extra={<Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>保存</Button>}>
      <Form form={form} layout="vertical" initialValues={{
        defaultDownloadPath: './downloads',
        maxHistoryItems: 100,
        autoStart: false,
        closeToTray: true,
        enableNotification: true,
      }}>
        <Divider orientation="left">通用</Divider>
        <Form.Item name="autoStart" label="开机自启动" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="closeToTray" label="关闭时最小化到托盘" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="enableNotification" label="启用通知" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Divider orientation="left">下载</Divider>
        <Form.Item name="defaultDownloadPath" label="默认下载目录">
          <Input placeholder="./downloads" />
        </Form.Item>

        <Divider orientation="left">浏览器</Divider>
        <Form.Item name="maxHistoryItems" label="历史记录最大条数">
          <Select
            options={[
              { value: 50, label: '50 条' },
              { value: 100, label: '100 条' },
              { value: 200, label: '200 条' },
              { value: 500, label: '500 条' },
            ]}
          />
        </Form.Item>

        <Divider orientation="left">关于</Divider>
        <Space direction="vertical">
          <div>版本：v0.1.0</div>
          <div>Electron：v28.x</div>
          <div>React：v18.x</div>
        </Space>
      </Form>
    </Card>
  );
}
