const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['node_modules/**', 'dist/**', 'web-build/**', 'ios/**', 'android/**'],
  },
  expoConfig,
]);
