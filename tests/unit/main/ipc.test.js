/**
 * IPC Handler 注册测试
 */

jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
}));

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: (key, defaultVal) => defaultVal,
    set: () => {},
  }));
});

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-' + Date.now(),
}));

const { ipcMain } = require('electron');

describe('IPC Handlers 注册验证', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../../src/main/ipc/index').registerAllHandlers();
  });

  test('应注册用户管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-users');
    expect(channels).toContain('save-user');
    expect(channels).toContain('delete-user');
  });

  test('应注册会话管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('create-user-session');
    expect(channels).toContain('activate-user');
    expect(channels).toContain('deactivate-user');
  });

  test('应注册文件管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-files');
    expect(channels).toContain('create-file');
    expect(channels).toContain('delete-file');
  });

  test('应注册下载管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('add-download');
    expect(channels).toContain('get-downloads');
  });

  test('应注册书签管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-bookmarks');
    expect(channels).toContain('save-bookmark');
  });

  test('应注册历史记录 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-history');
    expect(channels).toContain('clear-history');
  });

  test('应注册脚本管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-scripts');
    expect(channels).toContain('save-script');
    expect(channels).toContain('get-enabled-scripts');
  });

  test('应注册设置管理 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels).toContain('get-settings');
    expect(channels).toContain('save-settings');
    expect(channels).toContain('reset-settings');
  });

  test('应注册至少 25 个 IPC handler', () => {
    const channels = ipcMain.handle.mock.calls.map(([ch]) => ch);
    expect(channels.length).toBeGreaterThanOrEqual(25);
  });
});
