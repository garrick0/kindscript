module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/apps/cli/main.ts'  // Exclude CLI entry point (tested via E2E)
  ],
  coverageThreshold: {
    // Domain + application layers are the core logic and must be well-covered
    'src/domain/': {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90
    },
    'src/application/': {
      branches: 85,
      functions: 100,
      lines: 95,
      statements: 95
    }
    // Infrastructure adapters are covered by integration/E2E tests
    // but don't need strict coverage thresholds since they're thin wrappers
  }
};
