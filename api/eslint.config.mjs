import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
    },
  },
  {
    // Operational logging lives only here (docs/SECURITY.md §6).
    files: ['src/logging.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // The manual live-check script is a CLI tool, not library code.
    files: ['scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
);
