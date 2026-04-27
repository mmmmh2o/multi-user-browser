import React from 'react';

/**
 * 容器颜色圆点
 * 用于标签栏、容器选择器、右键菜单等位置
 *
 * @param {string} color - 圆点颜色
 * @param {number} size - 圆点直径
 */
export default function ContainerDot({ color = '#8c8c8c', size = 10, style }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        display: 'inline-block',
        flexShrink: 0,
        boxShadow: `0 0 0 1.5px ${color}30`,
        ...style,
      }}
    />
  );
}
