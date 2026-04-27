import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Table, Button, Input, Tag, Progress, Empty, message,
  Tooltip, Popconfirm, Modal, Form, Tabs, InputNumber,
} from 'antd';
import {
  PlusOutlined, PauseCircleOutlined, PlayCircleOutlined,
  CloseCircleOutlined, DownloadOutlined,
  ReloadOutlined, DeleteOutlined, SearchOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PauseOutlined,
  SettingOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  StopOutlined, ThunderboltOutlined, ClearOutlined,
} from '@ant-design/icons';
import { safeCall } from '../utils/ipcHelper';
import { formatBytes, formatSpeed } from '../utils/format';
import { DEFAULT_PAGINATION } from '../constants';

/* ─── 工具函数 ─── */
function formatETA(remaining, speed) {
  if (!remaining || !speed || speed <= 0) return '';
  const seconds = Math.ceil(remaining / speed);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getFileInfo(url, filename) {
  const name = filename || url?.split('/').pop()?.split('?')[0] || '未知文件';
  const ext = name.includes('.') ? name.split('.').pop().toUpperCase() : '';
  return { name, ext };
}

/* ─── 状态配置 ─── */
const STATUS = {
  downloading: { color: 'var(--mub-primary)', bg: '#e6f4ff', text: '下载中', icon: <ThunderboltOutlined /> },
  paused:      { color: 'var(--mub-warning)', bg: '#fffbe6', text: '已暂停', icon: <PauseOutlined /> },
  completed:   { color: 'var(--mub-success)', bg: '#f6ffed', text: '已完成', icon: <CheckCircleOutlined /> },
  failed:      { color: 'var(--mub-danger)', bg: '#fff2f0', text: '失败', icon: <ExclamationCircleOutlined /> },
  cancelled:   { color: 'var(--mub-text-muted)', bg: 'var(--mub-bg)', text: '已取消', icon: <StopOutlined /> },
  pending:     { color: 'var(--mub-text-muted)', bg: 'var(--mub-bg)', text: '等待中', icon: <DownloadOutlined /> },
};

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '下载中' },
  { key: 'waiting', label: '等待中' },
  { key: 'completed', label: '已完成' },
  { key: 'stopped', label: '已停止' },
];

/* ─── 速度指示条 ─── */
function SpeedBar({ download, upload }) {
  const hasSpeed = download > 0 || upload > 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: 'var(--mub-space-sm) var(--mub-space-md)',
      background: hasSpeed
        ? 'linear-gradient(135deg, var(--mub-primary-bg) 0%, #f6ffed 100%)'
        : 'var(--mub-bg)',
      borderRadius: 'var(--mub-radius)',
      border: `1px solid ${hasSpeed ? 'var(--mub-border)' : 'var(--mub-border-light)'}`,
      transition: 'all var(--mub-transition)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mub-space-sm)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--mub-radius-sm)',
          background: download > 0 ? 'var(--mub-primary-bg)' : 'var(--mub-bg-table-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--mub-transition)',
        }}>
          <ArrowDownOutlined style={{ color: download > 0 ? 'var(--mub-primary)' : 'var(--mub-text-muted)', fontSize: 13 }} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', lineHeight: 1, marginBottom: 2 }}>下载</div>
          <div style={{
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--mub-font-mono)',
            color: download > 0 ? 'var(--mub-primary)' : 'var(--mub-text-muted)',
            transition: 'color var(--mub-transition)',
          }}>
            {formatSpeed(download)}
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 24, background: 'var(--mub-border-light)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mub-space-sm)' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--mub-radius-sm)',
          background: upload > 0 ? '#f6ffed' : 'var(--mub-bg-table-hover)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--mub-transition)',
        }}>
          <ArrowUpOutlined style={{ color: upload > 0 ? 'var(--mub-success)' : 'var(--mub-text-muted)', fontSize: 13 }} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', lineHeight: 1, marginBottom: 2 }}>上传</div>
          <div style={{
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--mub-font-mono)',
            color: upload > 0 ? 'var(--mub-success)' : 'var(--mub-text-muted)',
            transition: 'color var(--mub-transition)',
          }}>
            {formatSpeed(upload)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 空状态插图 ─── */
function EmptyState({ hasSearch, onAdd }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 'var(--mub-space-md)',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'var(--mub-primary-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--mub-space-sm)',
      }}>
        <DownloadOutlined style={{ fontSize: 32, color: 'var(--mub-primary)' }} />
      </div>
      <div style={{ fontSize: 'var(--mub-font-size-md)', fontWeight: 500, color: 'var(--mub-text)' }}>
        {hasSearch ? '没有找到匹配的下载' : '还没有下载任务'}
      </div>
      <div className="mub-empty-hint" style={{ textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        {hasSearch
          ? '试试其他关键词，或清除搜索条件'
          : '在浏览器中点击下载链接会自动接管，或者手动添加一个下载任务'}
      </div>
      {!hasSearch && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} style={{ marginTop: 'var(--mub-space-sm)' }}>
          新建下载
        </Button>
      )}
    </div>
  );
}

/* ─── 主组件 ─── */
export default function DownloadManager() {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState({
    downloadSpeed: 0, uploadSpeed: 0,
    active: 0, waiting: 0, completed: 0, stopped: 0, total: 0,
  });
  const [speedLimit, setSpeedLimit] = useState({ download: 0, upload: 0 });
  const statsTimerRef = useRef(null);

  const loadDownloads = async () => {
    setLoading(true);
    try {
      const data = await safeCall(() => window.electronAPI?.getDownloads(), []);
      setDownloads(data || []);
    } catch { setDownloads([]); }
    finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const data = await safeCall(() => window.electronAPI?.getDownloadStats(), null);
      if (data) setStats(data);
    } catch {}
  };

  useEffect(() => {
    loadDownloads();
    loadStats();
    statsTimerRef.current = setInterval(loadStats, 2000);

    const handleProgress = (data) => {
      setDownloads((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data } : d)));
    };
    const handleCompleted = (data) => {
      setDownloads((prev) => prev.map((d) => (d.id === data.id ? { ...d, ...data } : d)));
      message.success(`下载完成: ${data.filename || data.url}`);
      loadStats();
    };
    const handleStarted = (task) => {
      setDownloads((prev) => {
        if (prev.some((d) => d.id === task.id)) return prev;
        return [task, ...prev];
      });
      message.info(`浏览器下载已接管: ${task.filename}`);
      loadStats();
    };

    window.electronAPI?.onDownloadProgress?.(handleProgress);
    window.electronAPI?.onDownloadCompleted?.(handleCompleted);
    window.electronAPI?.onDownloadStarted?.(handleStarted);

    return () => {
      clearInterval(statsTimerRef.current);
      window.electronAPI?.removeAllListeners?.('download-progress');
      window.electronAPI?.removeAllListeners?.('download-completed');
      window.electronAPI?.removeAllListeners?.('download-started');
    };
  }, []);

  /* ─── 操作 ─── */
  const handleAdd = async () => {
    if (!url.trim()) { message.warning('请输入下载链接'); return; }
    await safeCall(() => window.electronAPI.addDownload(url));
    message.success('下载任务已添加');
    setAddModalOpen(false); setUrl('');
    loadDownloads(); loadStats();
  };
  const handlePause = async (id) => { await safeCall(() => window.electronAPI.pauseDownload(id)); loadDownloads(); };
  const handleResume = async (id) => { await safeCall(() => window.electronAPI.resumeDownload(id)); loadDownloads(); };
  const handleCancel = async (id) => { await safeCall(() => window.electronAPI.cancelDownload(id)); loadDownloads(); loadStats(); };
  const handleRetry = async (id) => { await safeCall(() => window.electronAPI.retryDownload(id)); message.success('正在重试'); loadDownloads(); loadStats(); };
  const handleDelete = async (id) => { await safeCall(() => window.electronAPI.deleteDownload(id)); loadDownloads(); loadStats(); };
  const handlePurge = async () => {
    const r = await safeCall(() => window.electronAPI.purgeDownloads());
    if (r?.success) { message.success(`已清除 ${r.purged} 个任务`); loadDownloads(); loadStats(); }
  };
  const handlePauseAll = async () => { await safeCall(() => window.electronAPI.pauseAllDownloads()); loadDownloads(); };
  const handleResumeAll = async () => { await safeCall(() => window.electronAPI.resumeAllDownloads()); loadDownloads(); };
  const handleSetSpeedLimit = async () => {
    await safeCall(() => window.electronAPI.setSpeedLimit({ downloadSpeed: speedLimit.download, uploadSpeed: speedLimit.upload }));
    message.success('速度限制已更新'); setSettingsOpen(false);
  };

  /* ─── 过滤 ─── */
  const filtered = downloads.filter((d) => {
    if (activeTab !== 'all') {
      const map = { active: ['downloading'], waiting: ['pending'], completed: ['completed'], stopped: ['failed', 'cancelled', 'paused'] };
      if (!map[activeTab]?.includes(d.status)) return false;
    }
    if (searchText) {
      const kw = searchText.toLowerCase();
      return (d.filename || '').toLowerCase().includes(kw) || (d.url || '').toLowerCase().includes(kw);
    }
    return true;
  });

  const tabCounts = {
    all: downloads.length,
    active: downloads.filter((d) => d.status === 'downloading').length,
    waiting: downloads.filter((d) => d.status === 'pending').length,
    completed: downloads.filter((d) => d.status === 'completed').length,
    stopped: downloads.filter((d) => ['failed', 'cancelled', 'paused'].includes(d.status)).length,
  };

  /* ─── 表格列 ─── */
  const columns = [
    {
      title: '文件',
      dataIndex: 'filename',
      sorter: (a, b) => (a.filename || '').localeCompare(b.filename || ''),
      render: (name, record) => {
        const info = getFileInfo(record.url, name);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mub-space-sm)' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 'var(--mub-radius-sm)', flexShrink: 0,
              background: STATUS[record.status]?.bg || 'var(--mub-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--mub-font-size-sm)', fontWeight: 700,
              color: STATUS[record.status]?.color || 'var(--mub-text-muted)',
              fontFamily: 'var(--mub-font-mono)',
            }}>
              {info.ext ? `.${info.ext.slice(0, 3)}` : '📄'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontWeight: 500, fontSize: 'var(--mub-font-size-base)', color: 'var(--mub-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {info.name}
              </div>
              <div style={{
                fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {record.url?.length > 50 ? record.url.slice(0, 50) + '...' : record.url}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 200,
      sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
      render: (progress, record) => {
        const s = record.status || 'pending';
        const remaining = (record.totalSize || 0) - (record.downloadedSize || 0);
        const eta = s === 'downloading' ? formatETA(remaining, record.speed) : '';
        return (
          <div>
            <Progress
              percent={Math.round(progress || 0)}
              size="small"
              status={s === 'failed' ? 'exception' : s === 'completed' ? 'success' : 'active'}
              strokeColor={s === 'downloading'
                ? { '0%': 'var(--mub-primary)', '100%': 'var(--mub-success)' }
                : s === 'completed' ? 'var(--mub-success)' : undefined}
              trailColor="var(--mub-border-light)"
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', marginTop: 3, lineHeight: 1,
            }}>
              <span>{formatBytes(record.downloadedSize)} / {formatBytes(record.totalSize)}</span>
              {eta && <span style={{ color: 'var(--mub-primary)' }}>⏱ {eta}</span>}
            </div>
          </div>
        );
      },
    },
    {
      title: '速度',
      dataIndex: 'speed',
      width: 90,
      sorter: (a, b) => (a.speed || 0) - (b.speed || 0),
      render: (speed, record) => {
        if (record.status !== 'downloading') return <span style={{ color: 'var(--mub-text-muted)' }}>—</span>;
        return (
          <span style={{
            color: 'var(--mub-primary)', fontSize: 'var(--mub-font-size-sm)', fontWeight: 500,
            fontFamily: 'var(--mub-font-mono)',
          }}>
            {formatSpeed(speed)}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      filters: Object.entries(STATUS).map(([k, v]) => ({ text: v.text, value: k })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const info = STATUS[status] || STATUS.pending;
        return (
          <Tag
            icon={info.icon}
            style={{
              color: info.color, background: info.bg,
              border: `1px solid ${info.color}20`,
              borderRadius: 'var(--mub-radius-sm)', fontSize: 'var(--mub-font-size-sm)',
            }}
          >
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: '',
      width: 120,
      align: 'right',
      render: (_, record) => {
        const s = record.status || 'pending';
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {s === 'downloading' && (
              <Tooltip title="暂停">
                <Button type="text" size="small" icon={<PauseCircleOutlined />}
                  onClick={() => handlePause(record.id)}
                  style={{ color: 'var(--mub-warning)' }} />
              </Tooltip>
            )}
            {s === 'paused' && (
              <Tooltip title="继续">
                <Button type="text" size="small" icon={<PlayCircleOutlined />}
                  onClick={() => handleResume(record.id)}
                  style={{ color: 'var(--mub-primary)' }} />
              </Tooltip>
            )}
            {(s === 'failed' || s === 'cancelled') && (
              <Tooltip title="重试">
                <Button type="text" size="small" icon={<ReloadOutlined />}
                  onClick={() => handleRetry(record.id)}
                  style={{ color: 'var(--mub-primary)' }} />
              </Tooltip>
            )}
            {['downloading', 'paused', 'pending'].includes(s) && (
              <Popconfirm title="取消下载？" onConfirm={() => handleCancel(record.id)} okText="取消下载" cancelText="不了">
                <Tooltip title="取消">
                  <Button type="text" size="small" danger icon={<CloseCircleOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
            {['completed', 'failed', 'cancelled'].includes(s) && (
              <Popconfirm title="从列表移除？" onConfirm={() => handleDelete(record.id)}>
                <Tooltip title="删除">
                  <Button type="text" size="small" icon={<DeleteOutlined />}
                    style={{ color: 'var(--mub-text-muted)' }} />
                </Tooltip>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* ─── 顶部仪表板 ─── */}
      <Card style={{ marginBottom: 'var(--mub-space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--mub-space-sm)' }}>
          <SpeedBar download={stats.downloadSpeed} upload={stats.uploadSpeed} />

          {/* 统计胶囊 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--mub-space-md)', padding: '0 var(--mub-space-md)',
            background: 'var(--mub-bg)', borderRadius: 'var(--mub-radius)',
            border: '1px solid var(--mub-border-light)',
          }}>
            {[
              { label: '活跃', value: stats.active, color: 'var(--mub-primary)' },
              { label: '等待', value: stats.waiting, color: 'var(--mub-warning)' },
              { label: '完成', value: stats.completed, color: 'var(--mub-success)' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 18, fontWeight: 700, color: s.color,
                  fontFamily: 'var(--mub-font-mono)', lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* 操作按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mub-space-xs)' }}>
            <Tooltip title="暂停全部">
              <Button size="middle" icon={<PauseOutlined />} onClick={handlePauseAll}
                disabled={stats.active === 0} />
            </Tooltip>
            <Tooltip title="恢复全部">
              <Button size="middle" icon={<PlayCircleOutlined />} onClick={handleResumeAll}
                disabled={tabCounts.stopped === 0} />
            </Tooltip>
            <Popconfirm title="清除所有已完成任务？" onConfirm={handlePurge} disabled={tabCounts.completed === 0}>
              <Tooltip title="清除已完成">
                <Button size="middle" icon={<ClearOutlined />} disabled={tabCounts.completed === 0} />
              </Tooltip>
            </Popconfirm>
            <Tooltip title="速度限制">
              <Button size="middle" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
            </Tooltip>
            <Button type="primary" size="middle" icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}>
              新建下载
            </Button>
          </div>
        </div>
      </Card>

      {/* ─── 搜索 + 过滤 ─── */}
      <Card>
        <Input
          placeholder="搜索文件名或链接..."
          prefix={<SearchOutlined style={{ color: 'var(--mub-text-muted)' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ marginBottom: 'var(--mub-space-sm)', borderRadius: 'var(--mub-radius-sm)' }}
        />

        <Tabs
          size="small"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={FILTER_TABS.map((tab) => ({
            key: tab.key,
            label: (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--mub-space-xs)' }}>
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span style={{
                    fontSize: 'var(--mub-font-size-xs)', fontWeight: 600,
                    color: activeTab === tab.key ? 'var(--mub-primary)' : 'var(--mub-text-muted)',
                    background: activeTab === tab.key ? 'var(--mub-primary-bg)' : 'var(--mub-bg)',
                    padding: '1px 6px', borderRadius: 'var(--mub-radius-xl)',
                    fontFamily: 'var(--mub-font-mono)',
                  }}>
                    {tabCounts[tab.key]}
                  </span>
                )}
              </span>
            ),
          }))}
          style={{ marginBottom: 4 }}
        />

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{ ...DEFAULT_PAGINATION, size: 'small' }}
          locale={{
            emptyText: <EmptyState hasSearch={!!searchText} onAdd={() => setAddModalOpen(true)} />,
          }}
          onRow={(record) => ({
            style: {
              transition: 'background var(--mub-transition)',
              ...(record.status === 'downloading' ? { background: 'var(--mub-primary-bg)' } : {}),
            },
          })}
        />
      </Card>

      {/* ─── CSS 动画注入 ─── */}
      <style>{`
        .mub-row-active:hover { background: var(--mub-primary-bg) !important; }
        .mub-row-active td { border-bottom-color: var(--mub-primary) !important; }
      `}</style>

      {/* ─── 新建下载 ─── */}
      <Modal
        title="新建下载"
        open={addModalOpen}
        onOk={handleAdd}
        onCancel={() => setAddModalOpen(false)}
        okText="开始下载"
        cancelText="取消"
        width={480}
      >
        <Form layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item label="下载链接" required>
            <Input.TextArea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.zip&#10;支持多个链接，每行一个"
              rows={3}
              size="large"
              style={{ borderRadius: 'var(--mub-radius-sm)' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── 速度限制 ─── */}
      <Modal
        title="速度限制设置"
        open={settingsOpen}
        onOk={handleSetSpeedLimit}
        onCancel={() => setSettingsOpen(false)}
        okText="应用"
        cancelText="取消"
        width={400}
      >
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 'var(--mub-space-md)' }}>
            <div style={{ marginBottom: 'var(--mub-space-sm)', fontWeight: 500 }}>下载速度限制</div>
            <InputNumber
              min={0}
              value={speedLimit.download}
              onChange={(v) => setSpeedLimit((prev) => ({ ...prev, download: v || 0 }))}
              placeholder="0 = 不限速"
              style={{ width: '100%' }}
              addonAfter="KB/s"
            />
            <div style={{ fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', marginTop: 4 }}>设为 0 表示不限速</div>
          </div>
          <div>
            <div style={{ marginBottom: 'var(--mub-space-sm)', fontWeight: 500 }}>上传速度限制</div>
            <InputNumber
              min={0}
              value={speedLimit.upload}
              onChange={(v) => setSpeedLimit((prev) => ({ ...prev, upload: v || 0 }))}
              placeholder="0 = 不限速"
              style={{ width: '100%' }}
              addonAfter="KB/s"
            />
            <div style={{ fontSize: 'var(--mub-font-size-xs)', color: 'var(--mub-text-muted)', marginTop: 4 }}>设为 0 表示不限速</div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
