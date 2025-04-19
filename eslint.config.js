import js from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      'import/order': ['warn', { alphabetize: { order: 'asc' } }],
    },
  },
];
