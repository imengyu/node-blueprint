'use strict'
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

const env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : require('../config/prod.env')

const webpackConfig = [
  merge(baseWebpackConfig[0], {
    mode: 'production',
    devtool: config.build.productionSourceMap ? config.build.devtool : false,
    plugins: [
      new webpack.DefinePlugin({
        'process.env': env
      }),
      new HtmlWebpackPlugin({
        filename: process.env.NODE_ENV === 'testing'
          ? 'renderer.html'
          : config.build.index,
        template: 'html-withimg-loader!./src/renderer.html',
        inject: false,
        minify: {
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
        chunksSortMode: 'dependency'
      }),
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/pages/crashed.html',
        filename: config.build.assetsRoot + '/crashed.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/pages/docs.html',
        filename: config.build.assetsRoot + '/docs.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new HtmlWebpackPlugin({
        template: 'html-withimg-loader!./src/pages/neterr.html',
        filename: config.build.assetsRoot + '/neterr.html', inject: false,
        minify: { minifyCSS: true, minifyJS: true, collapseWhitespace: true, removeComments: true }
      }),
      new VueLoaderPlugin(),
      new JavaScriptObfuscator({
      }, [])
    ],
    optimization: {
      minimizer: [ new TerserPlugin({
        sourceMap: config.build.productionSourceMap,
        parallel: true
      }) ]
    }
  }) , baseWebpackConfig[1]
]

baseWebpackConfig[1].devtool = config.build.productionSourceMap ? config.build.devtool : false,
baseWebpackConfig[1].mode = 'production'
baseWebpackConfig[1].plugins.push(
  new webpack.DefinePlugin({
    'process.env': env,
  })
);

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
