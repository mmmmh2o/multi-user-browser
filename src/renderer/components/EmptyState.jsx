import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';

/**
 * 下载管理器空状态组件
 */
export default function EmptyState({ hasSearch, onAdd }) {
  return (
    <div className="mub-empty-state" role="status">
      <div className="mub-empty-state__icon" aria-hidden="true">
        <DownloadOutlined style={{ fontSize: 32, color: '#1677ff' }} />
      </div>
      <div className="mub-empty-state__title">
        {hasSearch ? '没有找到匹配的下载' : '还没有下载任务'}
      </div>
      <div className="mub-empty-state__hint">
        {hasSearch
          ? '试试其他关键词，或清除搜索条件'
          : '在浏览器中点击下载链接会自动接管，或者手动添加一个下载任务'}
      </div>
      {!hasSearch && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} style={{ marginTop: 8 }}>
          新建下载
        </Button>
      )}
    </div>
  );
}
