/** @type {import('jest').Config} */
module.exports = {
  displayName: 'unit',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
      },
    }],
  },
  testEnvironment: 'node',
  // No jest-expo, no React Native — pure TypeScript execution
};
