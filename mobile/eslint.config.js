const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ['node_modules/**', 'dist/**', 'web-build/**', 'ios/**', 'android/**'],
  },
  expoConfig,
  {
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@react-navigation/*'],
              message:
                "Import from 'expo-router'. It ships its own copy of React Navigation, so @react-navigation/* contexts are not the router's.",
            },
          ],
        },
      ],
    },
  },
]);

