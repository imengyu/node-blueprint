'use strict'
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const exec = require('child_process').exec;
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const chalk = require('chalk');

const devWebpackConfig = [
  merge(baseWebpackConfig[0], {
    mode: 'development',
    devtool: config.dev.devtool,

    // these devServer options should be customized in /config/index.js
    devServer: {
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': require('../config/dev.env.electron')
      }),  
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/renderer.html',
        filename: 'renderer.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/pages/crashed.html',
        filename: 'crashed.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/pages/neterr.html',
        filename: 'neterr.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new VueLoaderPlugin(),
    ]
  }), 
  merge(baseWebpackConfig[1], {
    mode: 'development',
    devtool: config.dev.devtool,
    plugins: [
      new webpack.DefinePlugin({
        'process.env': require('../config/dev.env.electron')
      }),  
    ]
  })
]

let electronStarted = false

module.exports = new Promise((resolve, reject) => {

  /*
  devWebpackConfig[0].plugins.push({
    apply: (compiler) => {
      compiler.hooks.done.tap('StartElectron', compilation => {
        if(!electronStarted) {
          electronStarted = true;

          setTimeout(() => {
            
            console.log(chalk.green('Staring electron'));
            exec(`cross-env NODE_ENV=developnment electron ./dist/development`, (error, stdout, stderr) => {
              if(error) {
                console.log(chalk.yellow('Can not start electron'));
                console.log(chalk.red(error));
                electronStarted = false;
                return;
              }
              console.log(chalk.yellow('Electron quited'));
              electronStarted = false;
            });
          }, 1000)
        }
      });
    }
  })
  */
  
  resolve(devWebpackConfig)
 
})
