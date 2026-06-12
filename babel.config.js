module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      ['babel-preset-expo', { unstable_transformImportMeta: true }],
    ],
    plugins: [
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-class-properties',
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
