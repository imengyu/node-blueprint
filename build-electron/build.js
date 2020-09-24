'use strict'

process.env.NODE_ENV = 'production'

const ora = require('ora')
const rm = require('rimraf')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const config = require('../config')
const webpackConfig = require('./webpack.prod.conf')
const shelljs = require('shelljs');

const spinner = ora('正在编译...')
spinner.start()

rm(path.join(config.build.assetsRoot, config.build.assetsSubDirectory), err => {
  if (err) throw err
  webpack(webpackConfig, (err, stats) => {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false, // If you are using ts-loader, setting this to true will make TypeScript errors show up during build.
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  编译发生错误\n'))
      console.log(chalk.red('\n'))
      console.log(stats.toString())
      process.exit(1)
    }

    console.log(chalk.cyan('  编译成功, 现在开始打包.\n'))

    shelljs.exec('npm run pack', function(status, output) {
      if (status != 0) {
        console.log(chalk.red('  编译成功, 但是打包失败\n'))
        console.log('  执行 npm run pack 失败 : ');
        console.log('  Exit status:', status);
        console.log('  Output : ', output);
      }else {
        console.log(chalk.cyan('  构建成功\n'))
        console.log('  目标程序放在  dist-build 文件夹中\n')
      }
    });
  })
})
