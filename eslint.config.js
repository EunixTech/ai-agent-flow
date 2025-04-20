// eslint.config.js
const js = require('@eslint/js');
const ts = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const jest = require('eslint-plugin-jest');
const prettier = require('eslint-config-prettier');

module.exports = [
  // Base JS recommended rules
  js.configs.recommended,
  prettier,

  // TypeScript support
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      'no-undef': 'off', // Let TS handle undefined
      'no-unused-vars': 'warn',
    },
  },

  // Jest support for test files
  {
    files: ['tests/**/*.ts'],
    plugins: { jest },
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        jest: true,
      },
    },
    rules: {
      // Add any Jest-specific rules if needed
    },
  },

  // Ignore unwanted paths
  {
    ignores: [
      'dist',
      'coverage',
      'docs',
      '*.md',
      '*.html',
      '*.json',
      '*.lock',
      '*.tgz',
      'node_modules',
    ],
  },
];
