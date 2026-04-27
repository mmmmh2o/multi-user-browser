import React from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

/**
 * 格式化速度显示
 */
function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * 速度指示条组件
 * 显示实时下载/上传速度
 */
export default function SpeedBar({ download, upload }) {
  const hasSpeed = download > 0 || upload > 0;

  return (
    <div
      className={`mub-speed-bar${hasSpeed ? ' mub-speed-bar--active' : ''}`}
      role="status"
      aria-label={`下载速度: ${formatSpeed(download)}, 上传速度: ${formatSpeed(upload)}`}
    >
      {/* 下载速度 */}
      <div className="mub-speed-item">
        <div className={`mub-speed-item__icon ${download > 0 ? 'mub-speed-item__icon--download-active' : 'mub-speed-item__icon--download'}`}>
          <ArrowDownOutlined style={{ color: download > 0 ? '#1677ff' : '#bbb', fontSize: 13 }} />
        </div>
        <div>
          <div className="mub-speed-item__label">下载</div>
          <div className={`mub-speed-item__value ${download > 0 ? 'mub-speed-item__value--download-active' : 'mub-speed-item__value--download'}`}>
            {formatSpeed(download)}
          </div>
        </div>
      </div>

      <div className="mub-speed-divider" aria-hidden="true" />

      {/* 上传速度 */}
      <div className="mub-speed-item">
        <div className={`mub-speed-item__icon ${upload > 0 ? 'mub-speed-item__icon--upload-active' : 'mub-speed-item__icon--upload'}`}>
          <ArrowUpOutlined style={{ color: upload > 0 ? '#52c41a' : '#bbb', fontSize: 13 }} />
        </div>
        <div>
          <div className="mub-speed-item__label">上传</div>
          <div className={`mub-speed-item__value ${upload > 0 ? 'mub-speed-item__value--upload-active' : 'mub-speed-item__value--upload'}`}>
            {formatSpeed(upload)}
          </div>
        </div>
      </div>
    </div>
  );
}
