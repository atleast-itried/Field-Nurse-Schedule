module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      roots: ['<rootDir>/packages/api/src'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/packages/ui/src'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      testMatch: ['**/__tests__/**/*.tsx', '**/?(*.)+(spec|test).tsx'],
      setupFilesAfterEnv: ['<rootDir>/packages/ui/src/setupTests.ts'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
  ],
}; 