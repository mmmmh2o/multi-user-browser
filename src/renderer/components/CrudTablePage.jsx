import React, { useState, useMemo } from 'react';
import { Card, Table, Input, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import CardIcon from './CardIcon';
import { DEFAULT_PAGINATION } from '../constants';

/**
 * 通用 CRUD 表格页面模板
 * 统一书签、历史、脚本、容器、文件等管理页面的布局
 *
 * @param {string} title - 页面标题
 * @param {ReactNode} icon - 标题图标
 * @param {string} iconColor - 图标颜色
 * @param {Array} columns - 表格列定义
 * @param {Array} dataSource - 数据源
 * @param {boolean} loading - 加载态
 * @param {string[]} searchFields - 搜索匹配的字段名
 * @param {string} searchPlaceholder - 搜索框占位文字
 * @param {ReactNode} headerExtra - 卡片头部右侧额外内容（按钮等）
 * @param {object} pagination - 分页配置，默认 DEFAULT_PAGINATION
 * @param {string} emptyText - 空状态主文字
 * @param {string} emptyHint - 空状态副文字
 * @param {ReactNode} children - 额外内容（Modal 等）
 */
export default function CrudTablePage({
  title,
  icon,
  iconColor = '#4f6ef7',
  columns,
  dataSource = [],
  loading = false,
  searchFields = [],
  searchPlaceholder = '搜索...',
  headerExtra,
  pagination = DEFAULT_PAGINATION,
  emptyText = '暂无数据',
  emptyHint,
  rowKey = 'id',
  children,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search || searchFields.length === 0) return dataSource;
    const kw = search.toLowerCase();
    return dataSource.filter((item) =>
      searchFields.some((field) =>
        (item[field] || '').toLowerCase().includes(kw),
      ),
    );
  }, [dataSource, search, searchFields]);

  const hasSearch = searchFields.length > 0;

  return (
    <Card
      title={
        <span className="mub-card-title">
          <CardIcon icon={icon} color={iconColor} />
          <span>{title}</span>
        </span>
      }
      extra={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasSearch && (
            <Input
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ width: 260 }}
            />
          )}
          {headerExtra}
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        locale={{
          emptyText: (
            <Empty
              description={
                <span>
                  {emptyText}
                  {emptyHint && (
                    <>
                      <br />
                      <span className="mub-empty-hint">{emptyHint}</span>
                    </>
                  )}
                </span>
              }
            />
          ),
        }}
      />
      {children}
    </Card>
  );
}
