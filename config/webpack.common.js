const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const JsonReplacerPlugin = require('./json-replacer-plugin');
const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
const path = require('path');
const fs = require('fs');
const ngtools = require('@ngtools/webpack');

const helpers = require('./helpers');

function versionReplacer(key, value) {
    if (key === "version") {
        var numbers = value.split(".");
        var major = numbers[0];
        var minor = numbers[1];
        var revision = numbers[2];
        var build = Number(numbers[3]) + 1;
        var version = major + "." + minor + "." + revision + "." + build;
        console.log("update version to ", version);
        return version;
    }
    return value;
}

const iconNameReplacer = function (fileName) {
    return function (key, value) {
        if (key === "default_icon") {
            return "icons/" + fileName;
        }
    };
};

var filesToCopy = [
    { from: '../lib/*.js', to: "./lib", toType: "dir" },
    { from: '../node_modules/bootstrap/dist/css/bootstrap.min.css', to: "./lib", toType: "dir" },
    { from: '../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff', to: "./", toType: "dir" },
    { from: '../src/icons', to: "./icons", toType: "dir" },
    { from: '../src/app.options', to: "./app.options", toType: "dir" },
    { from: '../src/i18n', to: "./i18n", toType: "dir" },
    { from: '../src/_locales', to: "./_locales", toType: "dir" },
    { from: '../src/*.html', to: "./", toType: "dir", flatten: true },
    { from: '../src/*.css', to: "./", toType: "dir", flatten: true },
    { from: '../src/*.json', to: "./", toType: "dir", flatten: true }
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
          // "vendor":     "../src/vendor.ts",
          // "index":      "../src/index.ts",
          "index.aot":  "../src/index.aot.ts",
          // "background": "../src/background.ts",
          "background": "../src/background.aot.ts",
          // "install":    "../src/install.ts",
          "install":    "../src/install.aot.ts",
          "globals": [
            "zone.js",
            "reflect-metadata"
          ]
    },
    output: {
      path: helpers.root('out'),
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
            '@angularclass/hmr-loader?pretty=' + !isProd + '&prod=' + isProd,
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
          loader: 'raw-loader'
        },
        {
          test: /\.(jpg|png|gif)$/,
          loader: 'file'
        }
      ]
    },
    plugins: [
      new ngtools.AotPlugin({
          tsConfigPath: './tsconfig-aot.json',
          baseDir: path.resolve(__dirname , '..'),
          entryModule: path.join(path.resolve(__dirname , '..'), 'src', 'app', 'app.module') + '#AppModule'
      }),
      new CopyWebpackPlugin([ ...filesToCopy ], {
          ignore: [ ...filesToIgnore ],
          copyUnmodified: false
        }
      ),
      new JsonReplacerPlugin({
        inputFile: "src/manifest.json",
        replacers: [ iconNameReplacer(options.defaultIcon), versionReplacer ]
      }),
      new ForkCheckerPlugin(),
      new webpack.ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src') // location of your src
      ),
      ...optionalPlugins
    ]
  }
}