/**
 * settingsHandlers 单元测试
 */

// Mock electron
jest.mock('electron', () => ({
  ipcMain: { handle: jest.fn() },
}));

// Mock electron-store
const mockStore = {};
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: (key, defaultVal) => mockStore[key] ?? defaultVal,
    set: (key, val) => { mockStore[key] = val; },
    get store() { return mockStore; },
    set store(val) { Object.assign(mockStore, val); },
  }));
});

jest.mock('electron-log', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

const { ipcMain } = require('electron');
const { registerSettingsHandlers } = require('../../../src/main/ipc/settingsHandlers');

describe('settingsHandlers', () => {
  let handlers = {};

  beforeAll(() => {
    // Capture all registered handlers
    ipcMain.handle.mockImplementation((channel, handler) => {
      handlers[channel] = handler;
    });
    registerSettingsHandlers();
  });

  beforeEach(() => {
    // Reset store
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
  });

  test('get-settings returns defaults when empty', async () => {
    const result = await handlers['get-settings']();
    expect(result).toHaveProperty('homepage', 'about:blank');
    expect(result).toHaveProperty('searchEngine', 'baidu');
    expect(result).toHaveProperty('maxHistory', 100);
    expect(result).toHaveProperty('darkMode', false);
    expect(result).toHaveProperty('fontSize', 'medium');
    expect(result).toHaveProperty('downloadPath', '');
    expect(result).toHaveProperty('autoClassify', false);
    expect(result).toHaveProperty('autoStart', false);
    expect(result).toHaveProperty('closeToTray', true);
    expect(result).toHaveProperty('enableNotification', true);
    expect(result).toHaveProperty('enableScripts', true);
  });

  test('save-settings merges with existing', async () => {
    const result = await handlers['save-settings'](null, { maxHistory: 200 });
    expect(result.success).toBe(true);
    expect(result.settings.maxHistory).toBe(200);
    expect(result.settings.autoStart).toBe(false); // default preserved
  });

  test('reset-settings restores defaults', async () => {
    await handlers['save-settings'](null, { autoStart: true, maxHistory: 500 });
    const result = await handlers['reset-settings']();
    expect(result.success).toBe(true);
    expect(result.settings.autoStart).toBe(false);
    expect(result.settings.maxHistory).toBe(100);
  });
});
