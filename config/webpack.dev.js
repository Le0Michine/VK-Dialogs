/**
 * @author: @AngularClass
 */

const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

/**
 * Webpack Plugins
 */
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'development';
const METADATA = webpackMerge(commonConfig({env: ENV}).metadata, {});

const helpers = require('./helpers');

const webpackOptions = {
    filesToCopy: [{ from: '../src/icons/icons_dev', to: "./icons", toType: "dir", flatten: true }],
    env: ENV,
    cleanOutput: false
};

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = (function(env) {
    webpackOptions.cleanOutput = env.clean;
    return webpackMerge(commonConfig(webpackOptions), {
        output: {
            path: helpers.root('out'),
            filename: "[name].js",
            sourceMapFilename: '[name].map',
        },
        devtool: 'cheap-module-source-map'
    });
});
