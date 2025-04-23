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
        project: ['./tsconfig.json', './tsconfig.test.json'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      'no-undef': 'off', // Let TS handle undefined
      'no-unused-vars': 'off', // Use TypeScript's unused vars check
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn'
    },
  },

  // Jest support for test files
  {
    files: ['tests/**/*.ts', 'examples/**/*.ts'],
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
      '@typescript-eslint/no-unused-vars': 'off', // Tests often have unused variables
      'jest/expect-expect': 'warn',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/valid-expect': 'error'
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
