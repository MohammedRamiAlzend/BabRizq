import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the customer app.
 *
 * Vitest automatically loads `./vite.config.ts` (path aliases, React plugin),
 * so this file only tunes the test runner itself.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
