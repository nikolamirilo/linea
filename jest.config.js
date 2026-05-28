module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@forge/api$': '<rootDir>/__mocks__/@forge/api.js',
    '^@forge/resolver$': '<rootDir>/__mocks__/@forge/resolver.js',
    '^@forge/sql$': '<rootDir>/__mocks__/@forge/sql.js',
  },
  collectCoverageFrom: [
    'src/lib/**/*.js',
    'src/modules/**/resolver.js',
    'src/webtriggers/**/*.js',
  ],
};
