/**
 * fileClassifier 单元测试
 * 直接导入源码，不复制逻辑
 */

const { classifyFile, getCategories, CATEGORY_MAP } = require('../../../src/main/utils/fileClassifier');

describe('fileClassifier', () => {
  test('分类图片文件', () => {
    expect(classifyFile('photo.jpg')).toBe('images');
    expect(classifyFile('icon.png')).toBe('images');
    expect(classifyFile('animation.gif')).toBe('images');
    expect(classifyFile('vector.svg')).toBe('images');
  });

  test('分类视频文件', () => {
    expect(classifyFile('movie.mp4')).toBe('videos');
    expect(classifyFile('clip.avi')).toBe('videos');
    expect(classifyFile('video.mkv')).toBe('videos');
  });

  test('分类音频文件', () => {
    expect(classifyFile('song.mp3')).toBe('audio');
    expect(classifyFile('track.flac')).toBe('audio');
    expect(classifyFile('recording.wav')).toBe('audio');
  });

  test('分类文档文件', () => {
    expect(classifyFile('report.pdf')).toBe('documents');
    expect(classifyFile('readme.md')).toBe('documents');
    expect(classifyFile('data.xlsx')).toBe('documents');
  });

  test('分类压缩文件', () => {
    expect(classifyFile('backup.zip')).toBe('archives');
    expect(classifyFile('data.tar.gz')).toBe('archives');
    expect(classifyFile('package.7z')).toBe('archives');
  });

  test('分类代码文件', () => {
    expect(classifyFile('script.js')).toBe('code');
    expect(classifyFile('main.py')).toBe('code');
    expect(classifyFile('app.tsx')).toBe('code');
  });

  test('未知扩展名归类为 other', () => {
    expect(classifyFile('style.css')).toBe('other');
    expect(classifyFile('data.json')).toBe('other');
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
    expect(classifyFile('SONG.MP3')).toBe('audio');
  });

  test('CATEGORY_MAP 包含 code 分类', () => {
    expect(CATEGORY_MAP).toHaveProperty('code');
    expect(CATEGORY_MAP.code).toContain('.js');
    expect(CATEGORY_MAP.code).toContain('.py');
  });

  test('getCategories 返回所有分类', () => {
    const cats = getCategories();
    expect(cats).toContain('images');
    expect(cats).toContain('code');
    // 'other' 是兜底分类，不在映射表中
    expect(cats).not.toContain('other');
  });
});
