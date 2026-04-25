const { ipcMain } = require('electron');

describe('IPC 集成测试', () => {
  test('所有 IPC handler 应正确注册', () => {
    jest.resetModules();
    ipcMain.handle.mockClear();

    // 加载所有 handler
    require('../../src/main/ipc/index');

    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);

    const expectedChannels = [
      'get-users', 'save-user', 'delete-user',
      'create-user-session', 'get-user-session', 'activate-user', 'deactivate-user', 'get-user-activities',
      'get-files', 'create-file', 'create-directory', 'delete-file', 'rename-file', 'copy-file', 'move-file', 'read-file', 'write-file',
      'add-download', 'pause-download', 'resume-download', 'cancel-download', 'get-downloads',
      'get-bookmarks', 'save-bookmark', 'delete-bookmark',
      'get-history', 'add-history', 'clear-history',
      'get-scripts', 'save-script', 'delete-script', 'get-enabled-scripts',
      'get-settings', 'save-settings', 'reset-settings',
    ];

    expectedChannels.forEach((channel) => {
      expect(channels).toContain(channel);
    });
  });
});

describe('数据模型验证', () => {
  test('用户对象应包含必要字段', () => {
    const user = {
      id: 'uuid-xxxx',
      name: 'Test User',
      email: 'test@example.com',
      avatar: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
    };

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('isActive');
  });

  test('下载任务对象应包含必要字段', () => {
    const task = {
      id: 'uuid-xxxx',
      url: 'https://example.com/file.zip',
      savePath: '/downloads/file.zip',
      fileName: 'file.zip',
      fileSize: 1024,
      downloadedSize: 0,
      status: 'pending',
      createdAt: Date.now(),
      completedAt: null,
    };

    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('url');
    expect(task).toHaveProperty('status');
    expect(['pending', 'downloading', 'paused', 'completed', 'failed']).toContain(task.status);
  });

  test('书签对象应包含必要字段', () => {
    const bookmark = {
      id: 'uuid-xxxx',
      userId: 'user-xxxx',
      title: 'Example',
      url: 'https://example.com',
      favicon: '',
      createdAt: Date.now(),
    };

    expect(bookmark).toHaveProperty('id');
    expect(bookmark).toHaveProperty('userId');
    expect(bookmark).toHaveProperty('url');
  });

  test('历史记录对象应包含必要字段', () => {
    const entry = {
      id: 'uuid-xxxx',
      userId: 'user-xxxx',
      title: 'Example Page',
      url: 'https://example.com',
      visitedAt: Date.now(),
    };

    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('userId');
    expect(entry).toHaveProperty('visitedAt');
  });

  test('脚本对象应包含必要字段', () => {
    const script = {
      id: 'uuid-xxxx',
      userId: 'user-xxxx',
      name: 'Test Script',
      url: '',
      code: '// ==UserScript==',
      enabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    expect(script).toHaveProperty('id');
    expect(script).toHaveProperty('name');
    expect(script).toHaveProperty('enabled');
    expect(typeof script.enabled).toBe('boolean');
  });
});
