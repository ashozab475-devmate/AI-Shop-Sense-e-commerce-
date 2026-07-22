// coverage.config.js
module.exports = {
  // Coverage collection settings
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    'lib/**/*.{js,jsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!app/layout.js',
    '!app/page.js',
    '!app/error.js',
  ],

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
  ],

  // Coverage directory
  coverageDirectory: 'coverage',

  // Global coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
    './app/api/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './lib/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },

  // Coverage ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
  ],

  // Minimum coverage targets by file type
  fileCoverageTargets: {
    'app/api/**': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    'lib/**': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    'app/components/**': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage summary settings
  coverageSummary: {
    showTotal: true,
    showUncovered: true,
    showMissing: true,
  },
};
