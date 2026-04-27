import React, { useState } from 'react';

const QUICK_LINKS = [
  { title: 'Google', url: 'https://www.google.com', icon: '🔍', color: '#4285f4' },
  { title: 'GitHub', url: 'https://github.com', icon: '🐙', color: '#333' },
  { title: 'YouTube', url: 'https://www.youtube.com', icon: '📺', color: '#ff0000' },
  { title: '百度', url: 'https://www.baidu.com', icon: '🐻', color: '#2932e1' },
  { title: 'Bilibili', url: 'https://www.bilibili.com', icon: '🎮', color: '#fb7299' },
  { title: '知乎', url: 'https://www.zhihu.com', icon: '💡', color: '#0066ff' },
];

/**
 * 新标签页组件
 * 展示搜索框和快捷链接
 */
export default function NewTabPage({ onNavigate }) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      onNavigate(searchValue.trim());
    }
  };

  return (
    <div className="mub-newtab" role="main" aria-label="新标签页">
      {/* Logo + 标题 */}
      <div style={{ textAlign: 'center' }}>
        <div className="mub-newtab__logo" aria-hidden="true">🌐</div>
        <div className="mub-newtab__title">Multi-User Browser</div>
        <div className="mub-newtab__subtitle">在地址栏输入网址，或点击下方快捷链接</div>
      </div>

      {/* 搜索框 */}
      <div className="mub-newtab__search" role="search">
        <span className="mub-newtab__search-icon" aria-hidden="true">🔍</span>
        <input
          className="mub-newtab__search-input"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="搜索或输入网址..."
          aria-label="搜索或输入网址"
          autoComplete="off"
        />
      </div>

      {/* 快捷链接 */}
      <nav className="mub-quick-links" aria-label="快捷链接">
        {QUICK_LINKS.map((link) => (
          <a
            key={link.url}
            className="mub-quick-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate(link.url);
            }}
            href={link.url}
            role="link"
            aria-label={`访问 ${link.title}`}
            style={{ textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 24px ${link.color}18`;
              e.currentTarget.style.borderColor = `${link.color}30`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '';
              e.currentTarget.style.borderColor = '';
            }}
          >
            <div
              className="mub-quick-link__icon"
              style={{ background: `${link.color}10` }}
              aria-hidden="true"
            >
              {link.icon}
            </div>
            <span className="mub-quick-link__label">{link.title}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
