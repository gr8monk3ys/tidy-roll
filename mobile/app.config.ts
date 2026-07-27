import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppVariant = 'development' | 'preview' | 'production';

function getVariant(): AppVariant {
  const raw = (process.env.APP_VARIANT || 'production').toLowerCase();
  if (raw === 'development' || raw === 'preview' || raw === 'production') return raw;
  return 'production';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = require('./app.json') as { expo: ExpoConfig };
  const variant = getVariant();

  const isDev = variant === 'development';

  const plugins = (base.expo.plugins ?? []).filter((p) => p !== 'expo-dev-client');
  if (isDev) plugins.splice(plugins.indexOf('expo-router') + 1, 0, 'expo-dev-client');

  return {
    ...config,
    ...base.expo,
    name: isDev ? 'TidyRoll (Dev)' : base.expo.name,
    plugins,
    extra: {
      ...base.expo.extra,
      appVariant: variant,
    },
  };
};

