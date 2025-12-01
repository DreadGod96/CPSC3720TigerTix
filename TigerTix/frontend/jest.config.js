// frontend/jest.config.js
/** @type {import('jest').Config} */
const config = {
  setupFiles: ['<rootDir>/src/setupTests.js'],
verbose: true,
// Attempt to resolve module resolution issues with react-router packages
moduleNameMapper: {
  "^react-router-dom$": "<rootDir>/node_modules/react-router-dom",
  "^react-router$": "<rootDir>/node_modules/react-router",
},
};

module.exports = config;