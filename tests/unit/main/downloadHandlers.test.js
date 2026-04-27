/**
 * downloadHandlers 单元测试
 */

jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
}));

const mockTasks = [];
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: (key, defaultVal) => key === 'tasks' ? mockTasks : defaultVal,
    set: (key, val) => { if (key === 'tasks') { mockTasks.length = 0; mockTasks.push(...val); } },
  }));
});

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'dl-uuid-' + Date.now(),
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    write: jest.fn(),
    end: jest.fn(),
  })),
  unlinkSync: jest.fn(),
}));

const { ipcMain } = require('electron');
const { registerDownloadHandlers } = require('../../../src/main/ipc/downloadHandlers');

describe('downloadHandlers', () => {
  let handlers = {};

  beforeAll(() => {
    ipcMain.handle.mockImplementation((channel, handler) => {
      handlers[channel] = handler;
    });
    registerDownloadHandlers();
  });

  beforeEach(() => {
    mockTasks.length = 0;
  });

  test('get-downloads returns empty array initially', async () => {
    const result = await handlers['get-downloads']();
    expect(result).toEqual([]);
  });

  test('get-downloads returns stored tasks', async () => {
    mockTasks.push({ id: '1', fileName: 'test.zip', status: 'completed' });
    const result = await handlers['get-downloads']();
    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('test.zip');
  });
});
