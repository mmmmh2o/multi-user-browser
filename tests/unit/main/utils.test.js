const path = require('path');
const os = require('os');

const { validatePath, getAllowedRoot } = require('../../src/main/utils/pathValidator');
const { classifyFile, getClassifiedPath, getCategories } = require('../../src/main/utils/fileClassifier');

describe('pathValidator', () => {
  const homeDir = os.homedir();

  test('应允许访问用户主目录下的路径', () => {
    const result = validatePath(path.join(homeDir, 'documents'));
    expect(result).toContain(homeDir);
  });

  test('应拒绝包含 .. 的路径遍历攻击', () => {
    expect(() => validatePath(path.join(homeDir, '..', 'etc', 'passwd'))).toThrow();
  });

  test('应拒绝空路径', () => {
    expect(() => validatePath('')).toThrow();
  });

  test('应拒绝非字符串参数', () => {
    expect(() => validatePath(null)).toThrow();
    expect(() => validatePath(undefined)).toThrow();
    expect(() => validatePath(123)).toThrow();
  });

  test('getAllowedRoot 应返回用户主目录', () => {
    expect(getAllowedRoot()).toBe(homeDir);
  });
});

describe('fileClassifier', () => {
  test('应正确分类图片文件', () => {
    expect(classifyFile('photo.jpg')).toBe('images');
    expect(classifyFile('icon.png')).toBe('images');
    expect(classifyFile('animation.gif')).toBe('images');
    expect(classifyFile('vector.svg')).toBe('images');
  });

  test('应正确分类视频文件', () => {
    expect(classifyFile('movie.mp4')).toBe('videos');
    expect(classifyFile('clip.avi')).toBe('videos');
    expect(classifyFile('show.mkv')).toBe('videos');
  });

  test('应正确分类音频文件', () => {
    expect(classifyFile('song.mp3')).toBe('audio');
    expect(classifyFile('recording.wav')).toBe('audio');
    expect(classifyFile('track.flac')).toBe('audio');
  });

  test('应正确分类文档文件', () => {
    expect(classifyFile('report.pdf')).toBe('documents');
    expect(classifyFile('notes.txt')).toBe('documents');
    expect(classifyFile('readme.md')).toBe('documents');
    expect(classifyFile('data.csv')).toBe('documents');
  });

  test('应正确分类压缩文件', () => {
    expect(classifyFile('backup.zip')).toBe('archives');
    expect(classifyFile('archive.7z')).toBe('archives');
  });

  test('应正确分类代码文件', () => {
    expect(classifyFile('app.js')).toBe('code');
    expect(classifyFile('main.py')).toBe('code');
    expect(classifyFile('index.tsx')).toBe('code');
  });

  test('未知扩展名应分类为 other', () => {
    expect(classifyFile('unknown.xyz')).toBe('other');
    expect(classifyFile('noext')).toBe('other');
  });

  test('空文件名应分类为 other', () => {
    expect(classifyFile('')).toBe('other');
    expect(classifyFile(null)).toBe('other');
    expect(classifyFile(undefined)).toBe('other');
  });

  test('应忽略大小写', () => {
    expect(classifyFile('PHOTO.JPG')).toBe('images');
    expect(classifyFile('Movie.MP4')).toBe('videos');
    expect(classifyFile('Song.MP3')).toBe('audio');
  });

  test('getClassifiedPath 应返回正确的分类路径', () => {
    const result = getClassifiedPath('photo.jpg', '/downloads');
    expect(result).toBe(path.join('/downloads', 'images', 'photo.jpg'));
  });

  test('getCategories 应返回所有分类', () => {
    const categories = getCategories();
    expect(categories).toContain('images');
    expect(categories).toContain('videos');
    expect(categories).toContain('audio');
    expect(categories).toContain('documents');
    expect(categories).toContain('archives');
    expect(categories).toContain('code');
  });
});
