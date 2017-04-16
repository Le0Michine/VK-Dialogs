const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const JsonReplacerPlugin = require('./json-replacer-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const fs = require('fs');

const helpers = require('./helpers');
let currentVersion = '';

function versionReplacer(key, value) {
    if (key === "version") {
        const [major, minor, revision, build] = value.split(".").map(x => +x);
        const version = `${major}.${minor}.${revision}.${build + 1}`;
        currentVersion = `${major}.${minor}.${revision}`;
        console.log("update version to ", version);
        return version;
    }
    return value;
}

function packageVersionReplacer(key, value) {
    if (key === "version") {
        return currentVersion || '0.0.0';
    }
    return value;
}

var filesToCopy = [
    // { from: '../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', to: "./", toType: "dir" },
    { from: '../dist/app.main/MaterialIcons-Regular.*', to: "./", toType: "dir", flatten: true },
    { from: '../_locales', to: "./_locales", toType: "dir" },
    { from: '../src/assets/sounds', to: "./assets/sounds", toType: "dir" },
    { from: '../manifest.json', to: "./", toType: "dir", flatten: true }
];

var filesToIgnore = [
  "icon.svg",
  "icon_new.svg",
  "VK_icon.png",
  ".DS_Store",
  ".gitkeep"
];

var optionalPlugins = [];

const extractSass = new ExtractTextPlugin({
    filename: "[name].css",
    disable: true
});

module.exports = function(options) {
  const isProd = options.env === 'production';
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

  let htmlMinifyOptions = undefined;
  if (isProd) {
    htmlMinifyOptions = {
      caseSensitive: true,
      collapseBooleanAttributes: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyCSS: true,
      removeComments: true,
      useShortDoctype: true
    };
  }

  return {
    name: "main",
    context: path.join(__dirname),
    entry: {
      // "index":  "../src/app.main.bundle.js",
      // "background":  "../src/app.background.bundle.js",
      // "install":  "../src/app.install.bundle.js",
      "options":  "../src/app.options/options.ts"
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
          test: /\.tsx?$/,
          exclude: [ /\.spec\.tsx?$/, '/src/' ],
          loader: 'ts-loader'
        },
        {
          test: /\.svg$/,
          loader: 'url-loader',
          options: {
            limit: 1000
          }
        },
        {
          test: /\.js$/,
          exclude: '/node_modules/',
          loader: 'babel-loader',
          options: {
            presets: ['es2015'],
            compact: false
          }
        },
        {
          test: /\.scss$/,
          use: [{
            loader: "style-loader" // creates style nodes from JS strings
          }, {
            loader: "css-loader" // translates CSS into CommonJS
          }, {
            loader: "sass-loader" // compiles Sass to CSS
          }]
        }
      ]
    },
    plugins: [
      // extractSass,
      new CopyWebpackPlugin([ ...filesToCopy ], {
          ignore: [ ...filesToIgnore ],
          copyUnmodified: false
        }
      ),
      new JsonReplacerPlugin({
        inputFile: "manifest.json",
        replacers: [ versionReplacer ]
      }),
      new JsonReplacerPlugin({
        inputFile: "package.json",
        replacers: [ packageVersionReplacer ]
      }),
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src') // location of your src
      ),
      new HtmlWebpackPlugin({
          title: 'VK Dialogs',
          chunks: ['index'],
          filename: 'index.html',
          template: '../src/app.main.ejs',
          minify: htmlMinifyOptions
      }),
      new HtmlWebpackPlugin({
          title: 'VK Dialogs background',
          chunks: ['background'],
          filename: 'background.html',
          template: '../src/app.background.ejs',
          minify: htmlMinifyOptions
      }),
      new HtmlWebpackPlugin({
          title: 'VK Dialogs install',
          chunks: ['install'],
          filename: 'install.html',
          template: '../src/app.install.ejs',
          minify: htmlMinifyOptions
      }),
      new HtmlWebpackPlugin({
          title: 'VK Dialogs options',
          chunks: ['options'],
          filename: 'options.html',
          template: '../src/app.options/options.ejs',
          inject: true,
          minify: htmlMinifyOptions
      }),
      new webpack.DefinePlugin({
        'process.env.PRODUCTION': JSON.stringify('production'),
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new ExtractTextPlugin({
        filename: "[name].css",
        disable: process.env.NODE_ENV === "development"
      }),
      ...optionalPlugins
    ]
  }
}