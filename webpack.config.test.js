'use strict';

var path = require('path');

module.exports = {
  module: {
    rules: [
      {
        // These files will be evaluated on build-time and
        // only their result will be used (see docs for `val-loader`)
        test: /app\/services\/data\/bubbles\.ts$/,
        use: ['val-loader', 'awesome-typescript-loader']
      },
      {
        test: /\.ts$/,
        // do not load files that will be processed by `val-loader`
        exclude: /app\/services\/data\/bubbles\.ts$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /\.html$/,
        loader: 'raw-loader'
      }
    ]
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.js', '.html'],
    alias: {
      'karma-test-shim$': path.resolve(__dirname, './karma-test-shim.ts')
    }
  }
};
