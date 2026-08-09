import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Vitest configuration for the marketer app.
 *
 * When a `vitest.config.ts` exists Vitest does NOT load `vite.config.ts`, so
 * the app's path aliases (`@/shared/lib/api`, etc.) and React plugin are
 * merged in explicitly. The `test` block only tunes the test runner itself.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  })
);
