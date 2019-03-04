module.exports = {
  testEnvironment: 'node',
  transform: {
    '\\.tsx?$': 'ts-jest',
    '\\.js$': 'babel-jest',
  },
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
  ],
  testPathIgnorePatterns: ['node_modules/', 'build/'],
  testRegex: '/__tests__/.*\\.(test|spec)\\.(ts|js)$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  setupFilesAfterEnv: ['./src/jest-setup.ts'],
};
