const { ipcMain } = require('electron');

describe('userHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/userHandlers');
  });

  test('get-users 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-users');
  });

  test('save-user 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('save-user');
  });

  test('delete-user 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('delete-user');
  });
});

describe('sessionHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/sessionHandlers');
  });

  test('create-user-session 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('create-user-session');
  });

  test('get-user-session 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-user-session');
  });

  test('activate-user 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('activate-user');
  });

  test('deactivate-user 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('deactivate-user');
  });

  test('get-user-activities 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-user-activities');
  });
});

describe('fileHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/fileHandlers');
  });

  test('get-files 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-files');
  });

  test('create-file 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('create-file');
  });

  test('delete-file 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('delete-file');
  });

  test('read-file 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('read-file');
  });

  test('write-file 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('write-file');
  });
});

describe('downloadHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/downloadHandlers');
  });

  test('add-download 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('add-download');
  });

  test('get-downloads 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-downloads');
  });
});

describe('bookmarkHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/bookmarkHandlers');
  });

  test('get-bookmarks 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-bookmarks');
  });

  test('save-bookmark 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('save-bookmark');
  });

  test('delete-bookmark 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('delete-bookmark');
  });
});

describe('historyHandlers', () => {
  beforeAll(() => {
    ipcMain.handle.mockClear();
    require('../../src/main/ipc/historyHandlers');
  });

  test('get-history 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('get-history');
  });

  test('add-history 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('add-history');
  });

  test('clear-history 应注册为 IPC handler', () => {
    const calls = ipcMain.handle.mock.calls;
    const channels = calls.map(([channel]) => channel);
    expect(channels).toContain('clear-history');
  });
});
