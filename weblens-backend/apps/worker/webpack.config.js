// apps/worker/webpack.config.js
const nodeExternals = require('webpack-node-externals');

module.exports = function(config) {
  return {
    ...config,
    externals: [
      nodeExternals({
        allowlist: [],
        modulesDir: require('path').resolve(__dirname, '../../node_modules'),
      }),
    ],
  };
};
