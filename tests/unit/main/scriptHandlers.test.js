/**
 * scriptHandlers 单元测试
 */

jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
}));

const mockScripts = [
  { id: '1', name: 'Test Script A', code: '// script A', enabled: true },
  { id: '2', name: 'Test Script B', code: '// script B', enabled: false },
  { id: '3', name: 'Test Script C', code: '// script C', enabled: true },
];

const mockStore = { scripts: [...mockScripts] };

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: (key, defaultVal) => mockStore[key] ?? defaultVal,
    set: (key, val) => { mockStore[key] = val; },
  }));
});

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: () => 'new-uuid-' + Date.now(),
}));

const { ipcMain } = require('electron');
const { registerScriptHandlers } = require('../../../src/main/ipc/scriptHandlers');

describe('scriptHandlers', () => {
  let handlers = {};

  beforeAll(() => {
    ipcMain.handle.mockImplementation((channel, handler) => {
      handlers[channel] = handler;
    });
    registerScriptHandlers();
  });

  beforeEach(() => {
    mockStore.scripts = [...mockScripts];
  });

  test('get-scripts returns all scripts', async () => {
    const result = await handlers['get-scripts']();
    expect(result).toHaveLength(3);
  });

  test('get-enabled-scripts returns only enabled', async () => {
    const result = await handlers['get-enabled-scripts']();
    expect(result).toHaveLength(2);
    expect(result.every(s => s.enabled)).toBe(true);
  });

  test('save-script creates new', async () => {
    const result = await handlers['save-script'](null, {
      name: 'New Script',
      code: '// new',
      enabled: true,
    });
    expect(result).toBeTruthy();
    expect(result.name).toBe('New Script');
    expect(result.id).toBeTruthy();
    expect(mockStore.scripts).toHaveLength(4);
  });

  test('save-script updates existing', async () => {
    const result = await handlers['save-script'](null, {
      id: '1',
      name: 'Updated Script',
      enabled: false,
    });
    expect(result.name).toBe('Updated Script');
    expect(result.enabled).toBe(false);
  });

  test('delete-script removes by id', async () => {
    const result = await handlers['delete-script'](null, '2');
    expect(result).toHaveLength(2);
    expect(result.find(s => s.id === '2')).toBeUndefined();
  });
});
