// Mock for electron module
const handleMock = jest.fn();
const ipcMain = { handle: handleMock };

const session = {
  fromPartition: jest.fn(() => ({
    clearStorageData: jest.fn(),
  })),
};

module.exports = { ipcMain, session };
