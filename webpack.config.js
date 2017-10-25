'use strict';

const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglify-js-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }),
  new ExtractTextPlugin({
    filename: '[name].[contenthash].css',
    disable: process.env.NODE_ENV === 'development'
  }),
  new HtmlWebpackPlugin({
    template: 'index.html'
  })
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(new UglifyJsPlugin({
    sourceMap: true
  }));
}

module.exports = {
  entry: {
    'main': ['./app/main.ts', './app/styles/main.less']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[chunkhash].js'
  },
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
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          use: [{loader: 'raw-loader'}, {loader: 'less-loader'}]
        })
      },
      {
        test: /\.html$/,
        loader: 'raw-loader'
      }
    ]
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js', '.html']
  },
  plugins: plugins
};
