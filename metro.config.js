const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: require.resolve("stream-browserify"),
  events: require.resolve("events"),
  // ws 패키지를 빈 모듈로 대체하여 차단
  ws: require.resolve("./polyfills/ws-polyfill.js"),
};

module.exports = config;
