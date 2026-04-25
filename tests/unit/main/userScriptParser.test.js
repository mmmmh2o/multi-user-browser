/**
 * UserScript 元数据解析器测试
 * 测试 webview-preload.js 中的 parseUserScriptMeta 和 matchesPage
 */

// 从 webview-preload 中提取的解析逻辑
function parseUserScriptMeta(code) {
  const meta = {};
  const headerMatch = code.match(/==UserScript==([\s\S]*?)==\/UserScript==/);
  if (!headerMatch) return meta;

  const lines = headerMatch[1].split('\n');
  for (const line of lines) {
    const m = line.match(/@(\w+)\s+(.*)/);
    if (m) {
      const key = m[1].trim();
      const value = m[2].trim();
      if (meta[key]) {
        if (!Array.isArray(meta[key])) meta[key] = [meta[key]];
        meta[key].push(value);
      } else {
        meta[key] = value;
      }
    }
  }
  return meta;
}

function matchesPage(meta, url) {
  if (!meta.match && !meta.include) return true;
  const patterns = [].concat(meta.match || [], meta.include || []);
  return patterns.some((pattern) => {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(url);
  });
}

describe('UserScript Meta Parser', () => {
  test('解析标准 UserScript 头部', () => {
    const code = `
// ==UserScript==
// @name         Test Script
// @namespace    https://example.com
// @version      1.0
// @description  A test script
// @match        https://*.google.com/*
// @match        https://github.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
console.log('hello');
`;
    const meta = parseUserScriptMeta(code);
    expect(meta.name).toBe('Test Script');
    expect(meta.namespace).toBe('https://example.com');
    expect(meta.version).toBe('1.0');
    expect(meta.description).toBe('A test script');
    expect(meta.match).toEqual([
      'https://*.google.com/*',
      'https://github.com/*',
    ]);
  });

  test('无 UserScript 头部返回空对象', () => {
    const meta = parseUserScriptMeta('console.log("plain script")');
    expect(meta).toEqual({});
  });

  test('处理多个相同标签', () => {
    const code = `
// ==UserScript==
// @match https://a.com/*
// @match https://b.com/*
// @include https://c.com/*
// ==/UserScript==
`;
    const meta = parseUserScriptMeta(code);
    expect(meta.match).toEqual(['https://a.com/*', 'https://b.com/*']);
    expect(meta.include).toBe('https://c.com/*');
  });
});

describe('URL Matching', () => {
  test('无匹配规则时匹配所有页面', () => {
    expect(matchesPage({}, 'https://any.com')).toBe(true);
  });

  test('match 规则匹配', () => {
    const meta = { match: 'https://*.google.com/*' };
    expect(matchesPage(meta, 'https://www.google.com/search')).toBe(true);
    expect(matchesPage(meta, 'https://google.com/')).toBe(true);
    expect(matchesPage(meta, 'https://github.com/')).toBe(false);
  });

  test('include 规则匹配', () => {
    const meta = { include: 'https://github.com/*' };
    expect(matchesPage(meta, 'https://github.com/user/repo')).toBe(true);
    expect(matchesPage(meta, 'https://google.com/')).toBe(false);
  });

  test('多个 match 规则', () => {
    const meta = {
      match: ['https://*.google.com/*', 'https://github.com/*'],
    };
    expect(matchesPage(meta, 'https://www.google.com/search')).toBe(true);
    expect(matchesPage(meta, 'https://github.com/repo')).toBe(true);
    expect(matchesPage(meta, 'https://example.com/')).toBe(false);
  });
});
