module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],
  testMatch: ['**/*.spec.ts'],
  verbose: true,
};

