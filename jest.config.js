module.exports = {
  testEnvironment: 'node',
  transform: {
    "\\.ts$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "js",
  ],
  testPathIgnorePatterns: ['node_modules/', 'build/'],
  testRegex: '/__tests__/.*\\.(test|spec)\\.(ts|js)$',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
  ],
};
