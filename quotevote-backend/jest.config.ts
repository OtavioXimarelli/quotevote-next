import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Path alias: ~/* → app/* (configured in tsconfig.json)
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.next/'],
  
  // Setup files for global test configuration
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};

export default config;