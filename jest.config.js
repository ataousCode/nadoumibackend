export default {
  testEnvironment: 'node',
  transform: {}, // Tells Jest not to use Babel/TS by default
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'], // Looks for files ending in .test.js
};
