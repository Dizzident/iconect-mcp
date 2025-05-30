/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '!**/__tests__/integration/**'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 0.3,
      functions: 10,
      lines: 6,
      statements: 6,
    },
    // Set higher thresholds for core modules
    'src/auth/**/*.ts': {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    'src/config/**/*.ts': {
      branches: 75,
      functions: 90,
      lines: 85,
      statements: 85,
    },
    'src/utils/errors.ts': {
      branches: 0,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    'src/utils/logger.ts': {
      branches: 75,
      functions: 60,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        moduleResolution: 'node',
        allowJs: true,
      },
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};