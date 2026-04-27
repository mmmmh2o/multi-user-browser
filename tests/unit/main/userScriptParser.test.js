/**
 * UserScript 元数据解析器测试
 * 测试 src/main/utils/userScriptParser.js
 */

const { parseUserScriptMeta, matchesPage, extractCode } = require('../../../src/main/utils/userScriptParser');

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

  test('空输入返回空对象', () => {
    expect(parseUserScriptMeta('')).toEqual({});
    expect(parseUserScriptMeta(null)).toEqual({});
    expect(parseUserScriptMeta(undefined)).toEqual({});
  });
});

describe('URL Matching', () => {
  test('无匹配规则时匹配所有页面', () => {
    expect(matchesPage({}, 'https://any.com')).toBe(true);
  });

  test('match 规则匹配', () => {
    const meta = { match: 'https://*.google.com/*' };
    expect(matchesPage(meta, 'https://www.google.com/search')).toBe(true);
    expect(matchesPage(meta, 'https://mail.google.com/mail')).toBe(true);
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

describe('extractCode', () => {
  test('提取 UserScript 头部后的代码', () => {
    const code = `// ==UserScript==\n// @name Test\n// ==/UserScript==\nconsole.log('hello');`;
    expect(extractCode(code)).toBe("console.log('hello');");
  });

  test('无头部时返回原文', () => {
    expect(extractCode('console.log("test")')).toBe('console.log("test")');
  });

  test('空输入返回空字符串', () => {
    expect(extractCode('')).toBe('');
    expect(extractCode(null)).toBe('');
  });
});
