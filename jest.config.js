// jest.config.js
module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native-community|@react-navigation|@react-native-screens|@react-native-fs|react-native-document-picker|@react-native|@react-native/.*)/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
};
