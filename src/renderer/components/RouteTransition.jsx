import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 路由切换过渡动画
 * 为页面切换添加淡入效果，消除生硬的瞬间跳转
 */
export default function RouteTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // 路由变化时：先淡出，再淡入
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}
