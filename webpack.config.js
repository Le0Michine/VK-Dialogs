var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');
var fs = require('fs');

function JsonReplacerPlugin(options) {
    this.inputFile = options.inputFile;
    this.outputFile = options.outputFile || this.inputFile;
    this.replacer = options.replacer || null;
    this.spacer = options.spacer || "    ";
}

JsonReplacerPlugin.prototype.apply = function(compiler) {
    var file = fs.readFileSync(this.inputFile);
    fs.writeFileSync(this.outputFile, JSON.stringify(JSON.parse(file), this.replacer, this.spacer));
};

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

module.exports = [{
  name: "main",
  context: path.join(__dirname),
  entry: {
        "app": './src/app/main.ts',
        "app.background": "./src/app.background/main.ts",
        "app.installguide": "./src/app.installguide/main.ts"
  },
  output: {
    path: "./out/",
    filename: "[name]/main.js"
  },
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: [ 
      {
        test: /\.ts$/,
        loaders: ['ts-loader', 'angular2-template-loader'],
        configFileName: "src/tsconfig.json"
      },
      { 
        test: /\.js$/,
        exclude: '/node_modules/',
        loader: 'babel',
        query: { compact: true, presets: ['es2015'], minified: true, comments: false }
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
        test: /\.png$/,
        loader: 'file?name=icons/[name].[hash].[ext]'
      }
    ]
  },
  'html-minify-loader': {
    empty: true,        // KEEP empty attributes
    cdata: true,        // KEEP CDATA from scripts
    comments: true,     // KEEP comments
    dom: { // options of !(htmlparser2)[https://github.com/fb55/htmlparser2]
      lowerCaseAttributeNames: false, // do not call .toLowerCase for each attribute name (Angular2 use camelCase attributes)
    }
  },
  plugins: [
    new CopyWebpackPlugin([ 
        { from: 'src/icons', to: "./icons", toType: "dir" },
//        { from: 'src/fonts', to: "./fonts", toType: "dir" },
        { from: 'src/app.options', to: "./app.options", toType: "dir" },
        { from: 'src/app.installguide', to: "./app.pagecontent", toType: "dir" },
//        { from: 'src/app.pagecontent', to: "./app.pagecontent", toType: "dir" },
        { from: 'src/i18n', to: "./i18n", toType: "dir" },
        { from: 'src/_locales', to: "./_locales", toType: "dir" },
        { from: 'src/*.html', to: "./", toType: "dir", flatten: true },
        { from: 'src/*.css', to: "./", toType: "dir", flatten: true },
        { from: 'src/*.json', to: "./", toType: "dir", flatten: true },
        { from: 'src/*.js', to: "./", toType: "dir", flatten: true },
        { from: 'src/node_modules/core-js/client/shim.min.js', to: "./node_modules/core-js/client", toType: "dir", flatten: true },
        { from: 'src/node_modules/zone.js/dist/zone.js', to: "./node_modules/zone.js/dist", toType: "dir", flatten: true },
        { from: 'src/node_modules/reflect-metadata/Reflect.js', to: "./node_modules/reflect-metadata", toType: "dir", flatten: true },
        { from: 'src/node_modules/systemjs/dist/system.src.js', to: "./node_modules/systemjs/dist", toType: "dir", flatten: true },
        { from: 'src/node_modules/bootstrap/dist/css/bootstrap.min.css', to: "./node_modules/bootstrap/dist/css", toType: "dir", flatten: true }
      ], 
      {
        ignore: [ "typings.json", "gulpfile.js", "package.json", "tsconfig.json", "tslint.json" ],
        // By default, we only copy modified files during 
        // a watch or webpack-dev-server build. Setting this 
        // to `true` copies all files. 
        copyUnmodified: true
      }
    ),
    new CleanWebpackPlugin(['./out/*'], {
      verbose: true, 
      dry: false
    }),
    new JsonReplacerPlugin({ inputFile: "src/manifest.json", replacer: versionReplacer }),
    /*new webpack.optimize.UglifyJsPlugin({
      sourceMap: false,
      compress: {
        warnings: false,
        properties: true,
        sequences: true,
        dead_code: true,
        conditionals: true,
        comparisons: true,
        evaluate: true,
        booleans: true,
        unused: true,
        loops: true,
        hoist_funs: true,
        cascade: true,
        if_return: true,
        join_vars: true,
        //drop_console: true,
        drop_debugger: true,
        //unsafe: true,
        hoist_vars: true,
        negate_iife: true,
        //side_effects: true,
        screw_ie8: true
      },
      mangle: {
        toplevel: true,
        sort: true,
        eval: true,
        properties: true
      },
      output: {
        space_colon: false,
        comments: false
      }
    })/**/
  ]
}]