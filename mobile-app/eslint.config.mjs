import { defineConfig } from 'eslint/config';
import nativeConfig from 'eslint-config-universe/flat/native.js';

export default defineConfig([
  ...nativeConfig,
  {
    ignores: ['node_modules/**', 'dist/**', '.expo/**', 'android/**', 'ios/**'],
  },
  {
    rules: {
      // Downgrade noisy type-safety rules to warnings for mobile app development
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
