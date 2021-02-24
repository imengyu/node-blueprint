'use strict'
const webpack = require('webpack')
const config = require('../config-electron')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const devWebpackConfig = [
  merge(baseWebpackConfig[0], {
    mode: 'development',
    devtool: config.dev.devtool,

    // these devServer options should be customized in /config/index.js
    devServer: {
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': require('../config-electron/dev.env')
      }),  
      new HtmlWebpackPlugin({
        template: './src/pages/renderer.html',
        filename: 'renderer.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/crashed.html',
        filename: 'crashed.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: './src/pages/neterr.html',
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
        'process.env': require('../config-electron/dev.env')
      }),  
    ]
  })
]

module.exports = new Promise((resolve, reject) => {
  resolve(devWebpackConfig)
})
