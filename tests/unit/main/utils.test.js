/**
 * 工具函数测试
 * 直接导入源码，不复制逻辑
 */

const path = require('path');
const os = require('os');

const { validatePath, getAllowedRoot } = require('../../../src/main/utils/pathValidator');
const { classifyFile } = require('../../../src/main/utils/fileClassifier');

describe('pathValidator', () => {
  const ALLOWED_ROOT = getAllowedRoot();

  test('允许用户主目录下的路径', () => {
    const safePath = path.join(ALLOWED_ROOT, 'Documents', 'test.txt');
    expect(() => validatePath(safePath)).not.toThrow();
  });

  test('拒绝路径遍历攻击', () => {
    const malicious = path.join(ALLOWED_ROOT, '..', '..', 'etc', 'passwd');
    expect(() => validatePath(malicious)).toThrow();
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

describe('fileClassifier', () => {
  test('分类图片文件', () => {
    expect(classifyFile('photo.jpg')).toBe('images');
    expect(classifyFile('icon.png')).toBe('images');
    expect(classifyFile('vector.svg')).toBe('images');
  });

  test('分类视频文件', () => {
    expect(classifyFile('movie.mp4')).toBe('videos');
    expect(classifyFile('clip.avi')).toBe('videos');
  });

  test('分类音频文件', () => {
    expect(classifyFile('song.mp3')).toBe('audio');
    expect(classifyFile('track.flac')).toBe('audio');
  });

  test('分类文档文件', () => {
    expect(classifyFile('report.pdf')).toBe('documents');
    expect(classifyFile('readme.md')).toBe('documents');
    expect(classifyFile('data.csv')).toBe('documents');
  });

  test('分类压缩文件', () => {
    expect(classifyFile('backup.zip')).toBe('archives');
    expect(classifyFile('archive.7z')).toBe('archives');
  });

  test('分类代码文件', () => {
    expect(classifyFile('app.js')).toBe('code');
    expect(classifyFile('main.py')).toBe('code');
  });

  test('未知扩展名归类为 other', () => {
    expect(classifyFile('unknown.xyz')).toBe('other');
    expect(classifyFile('noext')).toBe('other');
  });

  test('空/无效输入归类为 other', () => {
    expect(classifyFile('')).toBe('other');
    expect(classifyFile(null)).toBe('other');
    expect(classifyFile(undefined)).toBe('other');
  });

  test('大小写不敏感', () => {
    expect(classifyFile('PHOTO.JPG')).toBe('images');
    expect(classifyFile('Movie.MP4')).toBe('videos');
    expect(classifyFile('Song.MP3')).toBe('audio');
  });
});
