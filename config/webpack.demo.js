const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
const path = require('path');
const fs = require('fs');
const ngtools = require('@ngtools/webpack');

const helpers = require('./helpers');

var filesToCopy = [
    { from: '../lib/jquery.js', to: "./lib", toType: "dir" },
    { from: '../node_modules/bootstrap/dist/css/bootstrap.min.css', to: "./lib", toType: "dir" },
    { from: '../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', to: "./", toType: "dir" },
    { from: '../src/app.options', to: "./app.options", toType: "dir" },
    { from: '../src/_locales', to: "./_locales", toType: "dir" },
    { from: '../src/index.html', to: "./", toType: "dir", flatten: true },
    { from: '../src/index.css', to: "./", toType: "dir", flatten: true },
    { from: '../src/emoji.css', to: "./", toType: "dir", flatten: true },
    { from: '../src/demo/manifest.json', to: "./", toType: "dir", flatten: true },
    { from: '../src/icons', to: "./icons", toType: "dir", flatten: true }
];

var filesToIgnore = [
  "*.svg",
  "VK_icon.png",
  // "doc_icons.png"
];

var optionalPlugins = [];

module.exports = function() {
  return {
    name: "main",
    context: path.join(__dirname),
    entry: {
          "index":  "../src/demo/main.ts",
          "globals": [
            "zone.js",
            "reflect-metadata"
          ]
    },
    output: {
      path: helpers.root('demo'),
      filename: "[name].js",
      sourceMapFilename: '[name].map',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: [helpers.root("src"), "node_modules"]
    },
    module: {
      loaders: [ 
        {
          test: /\.ts$/,
          loaders: [
            '@angularclass/hmr-loader?pretty=true&prod=false',
            'awesome-typescript-loader',
            'angular2-template-loader'
          ],
          exclude: [/\.(spec|e2e)\.ts$/]
        },
        {
          test: /\.json$/,
          loader: 'json-loader'
        },
        { 
          test: /\.js$/,
          exclude: '/node_modules/',
          loader: 'babel-loader',
          query: {
            presets: ['es2015'],
            plugins: ['transform-decorators-legacy', 'transform-class-properties']
          }
        },
        {
          test: /\.html$/,
          loaders: ['raw-loader'/*, 'html-minify-loader'*/]
        },
        {
          test: /\.css$/,
          loaders: [/* 'to-string-loader', 'css-loader' */ 'raw-loader']
        },
        {
          test: /\.(jpg|png|gif)$/,
          loader: 'file-loader'
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin([ ...filesToCopy ], {
          ignore: [ ...filesToIgnore ],
          copyUnmodified: false
        }
      ),
      new ForkCheckerPlugin(),
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src') // location of your src
      ),
      new webpack.DefinePlugin({
        'process.env.PRODUCTION': JSON.stringify(false)
      }),  
      new CleanWebpackPlugin(['demo/*'], {
        root: helpers.root(),
        verbose: true, 
        dry: false
      })
    ]
  };
}()