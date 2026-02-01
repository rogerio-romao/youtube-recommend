import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    // Global test setup file
    setupFiles: ['./tests/setup.ts'],

    // Environment for tests
    environment: 'nuxt',

    // Include patterns for test files
    include: ['tests/**/*.test.ts'],

    // Exclude patterns
    exclude: ['node_modules', '.nuxt', 'dist'],

    // Enable globals (describe, it, expect, etc.)
    globals: true,

    // Timeout for tests (10 seconds)
    testTimeout: 10000,

    // Coverage configuration (optional, can be enabled later)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['server/services/**/*.ts', 'server/utils/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts'],
    },
  },
})
