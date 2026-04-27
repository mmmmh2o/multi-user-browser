// Mock for electron-log module
module.exports = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  transports: {
    file: { resolvePath: jest.fn(), level: 'info', format: '' },
    console: { level: 'debug', format: '' },
  },
};
