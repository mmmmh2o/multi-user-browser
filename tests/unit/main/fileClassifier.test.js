/**
 * fileClassifier 单元测试
 */

const path = require('path');

// 复制 fileClassifier 逻辑
function classifyFile(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const categories = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'],
    videos: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
  };
  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
}

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

  test('未知扩展名归类为 other', () => {
    expect(classifyFile('script.js')).toBe('other');
    expect(classifyFile('style.css')).toBe('other');
    expect(classifyFile('data.json')).toBe('other');
    expect(classifyFile('noext')).toBe('other');
  });

  test('大小写不敏感', () => {
    expect(classifyFile('PHOTO.JPG')).toBe('images');
    expect(classifyFile('Movie.MP4')).toBe('videos');
    expect(classifyFile('SONG.MP3')).toBe('audio');
  });
});
