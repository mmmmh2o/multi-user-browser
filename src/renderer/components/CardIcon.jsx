import React from 'react';

/**
 * 统一的卡片标题图标组件
 * 替代各页面重复的内联样式
 *
 * @param {object} icon - Ant Design icon 组件
 * @param {string} color - 主题色（不含透明度）
 * @param {number} [size=32] - 图标容器大小
 */
export default function CardIcon({ icon, color = '#4f6ef7', size = 32 }) {
  return (
    <span
      className="mub-card-icon-wrapper"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: `${color}18`,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.47,
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
  );
}
