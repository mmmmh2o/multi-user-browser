// Mock for electron-store module
module.exports = jest.fn().mockImplementation(() => {
  const store = {};
  return {
    get: jest.fn((key, defaultValue) => store[key] || defaultValue),
    set: jest.fn((key, value) => { store[key] = value; }),
    delete: jest.fn((key) => { delete store[key]; }),
    has: jest.fn((key) => key in store),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  };
});
