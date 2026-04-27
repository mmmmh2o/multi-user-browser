/**
 * pathValidator 单元测试
 * 直接导入源码，不复制逻辑
 */

const os = require('os');
const path = require('path');

// 直接导入实际的 validatePath
const { validatePath, getAllowedRoot } = require('../../../src/main/utils/pathValidator');

describe('pathValidator', () => {
  const ALLOWED_ROOT = getAllowedRoot();

  test('允许访问用户主目录下的路径', () => {
    const safePath = path.join(ALLOWED_ROOT, 'Documents', 'test.txt');
    expect(() => validatePath(safePath)).not.toThrow();
    expect(validatePath(safePath)).toBe(safePath);
  });

  test('允许访问用户主目录本身', () => {
    expect(() => validatePath(ALLOWED_ROOT)).not.toThrow();
  });

  test('拒绝路径遍历攻击', () => {
    const malicious = path.join(ALLOWED_ROOT, '..', '..', 'etc', 'passwd');
    expect(() => validatePath(malicious)).toThrow();
  });

  test('拒绝绝对路径越界', () => {
    expect(() => validatePath('/etc/passwd')).toThrow();
  });

  test('拒绝空路径', () => {
    expect(() => validatePath('')).toThrow('无效的路径参数');
  });

  test('拒绝非字符串参数', () => {
    expect(() => validatePath(null)).toThrow();
    expect(() => validatePath(undefined)).toThrow();
    expect(() => validatePath(123)).toThrow();
  });
});
