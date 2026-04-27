module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    indent: ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['src/main/**/*.js'],
      env: {
        browser: false,
        node: true,
      },
    },
    {
      // webview preload runs in browser context
      files: ['src/main/preload/**/*.js'],
      env: {
        browser: true,
        node: true,
      },
      rules: {
        'no-console': 'off',
        'no-empty': 'warn',
      },
    },
  ],
};
