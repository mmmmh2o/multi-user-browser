module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/main/**/*.js',
    'src/preload/**/*.js',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  setupFilesAfterSetup: [],
  moduleFileExtensions: ['js', 'jsx', 'json'],
};
