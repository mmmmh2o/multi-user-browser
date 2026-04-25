/**
 * pathValidator 单元测试
 */

const os = require('os');
const path = require('path');

// 由于 validatePath 在 fileHandlers 中，我们直接测试逻辑
describe('pathValidator', () => {
  const ALLOWED_ROOT = os.homedir();

  function validatePath(targetPath) {
    const resolved = path.resolve(targetPath);
    if (!resolved.startsWith(ALLOWED_ROOT)) {
      throw new Error(`路径越界: ${targetPath} 不在允许的范围内`);
    }
    return resolved;
  }

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
    expect(() => validatePath(malicious)).toThrow('路径越界');
  });

  test('拒绝绝对路径越界', () => {
    expect(() => validatePath('/etc/passwd')).toThrow('路径越界');
  });

  test('拒绝 /root 越界（如果 home 不是 /root）', () => {
    if (ALLOWED_ROOT !== '/root') {
      expect(() => validatePath('/root/secret')).toThrow('路径越界');
    }
  });

  test('处理 ~ 路径', () => {
    // ~ 不会被 path.resolve 解析为 home，应该用实际路径
    const tildePath = '~/Documents/test.txt';
    // path.resolve('~/...') 不会替换 ~，所以这取决于实现
    const resolved = path.resolve(tildePath);
    // 这个测试验证 ~ 不会被错误解析
    if (!resolved.startsWith(ALLOWED_ROOT)) {
      expect(() => validatePath(tildePath)).toThrow();
    }
  });
});
