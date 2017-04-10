const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const JsonReplacerPlugin = require('./json-replacer-plugin');
const path = require('path');
const fs = require('fs');

const helpers = require('./helpers');

function versionReplacer(key, value) {
    if (key === "version") {
        const [major, minor, revision, build] = value.split(".").map(x => +x);
        const version = `${major}.${minor}.${revision}.${build + 1}`;
        console.log("update version to ", version);
        return version;
    }
    return value;
}

var filesToCopy = [
    // { from: '../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', to: "./", toType: "dir" },
    { from: '../dist/app.main/MaterialIcons-Regular.*', to: "./", toType: "dir", flatten: true },
    { from: '../src/app.options', to: "./app.options", toType: "dir" },
    { from: '../_locales', to: "./_locales", toType: "dir" },
    { from: '../manifest.json', to: "./", toType: "dir", flatten: true }
];

var filesToIgnore = [
  "*.svg",
  "VK_icon.png"
];

var optionalPlugins = [];

module.exports = function(options) {
  isProd = options.env === 'production';
  if (options.filesToIgnore) {
      filesToIgnore = [...filesToIgnore, ...options.filesToIgnore];
  }
  if (options.filesToCopy) {
      filesToCopy = [...filesToCopy, ...options.filesToCopy];
  }

  if (options.cleanOutput) {
      optionalPlugins.push(
            new CleanWebpackPlugin(['out/*'], {
                root: path.resolve(__dirname , '..'),
                verbose: true, 
                dry: false
            })
      );
  }

  return {
    name: "main",
    context: path.join(__dirname),
    entry: {
      "index":  "../src/app.main.bundle.js",
      "background":  "../src/app.background.bundle.js"
    },
    output: {
      path: helpers.root('out'),
      filename: "[name].js",
      // sourceMapFilename: '[name].map',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: [helpers.root("src"), "node_modules"]
    },
    module: {
      loaders: [
        { 
          test: /\.js$/,
          exclude: '/node_modules/',
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            compact: false
          }
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin([ ...filesToCopy ], {
          ignore: [ ...filesToIgnore ],
          copyUnmodified: false
        }
      ),
      new JsonReplacerPlugin({
        inputFile: "manifest.json",
        replacers: [ versionReplacer ]
      }),
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src') // location of your src
      ),
      new HtmlWebpackPlugin({
          title: 'VK-Dialogs',
          chunks: ['index'],
          filename: 'index.html',
          template: '../src/app.main.ejs'
      }),
      new HtmlWebpackPlugin({
          title: 'VK-Dialogs-background',
          chunks: ['background'],
          filename: 'background.html',
          template: '../src/app.background.ejs'
      }),
      new webpack.DefinePlugin({
        'process.env.PRODUCTION': JSON.stringify('production'),
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      ...optionalPlugins
    ]
  }
}