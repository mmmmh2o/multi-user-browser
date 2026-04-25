/**
 * 工具函数测试
 * 测试 pathValidator 和 fileClassifier 的核心逻辑
 */

const path = require('path');
const os = require('os');

describe('pathValidator 逻辑', () => {
  const ALLOWED_ROOT = os.homedir();

  function validatePath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('无效的路径参数');
    }
    const resolved = path.resolve(targetPath);
    if (!resolved.startsWith(ALLOWED_ROOT)) {
      throw new Error(`路径越界: ${targetPath}`);
    }
    const normalized = path.normalize(targetPath);
    if (normalized.includes('..')) {
      throw new Error(`路径遍历检测: ${targetPath}`);
    }
    return resolved;
  }

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

describe('fileClassifier 逻辑', () => {
  const CATEGORY_MAP = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'],
    videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
    code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java'],
  };

  function classifyFile(fileName) {
    if (!fileName) return 'other';
    const ext = path.extname(fileName).toLowerCase();
    for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
      if (extensions.includes(ext)) return category;
    }
    return 'other';
  }

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
