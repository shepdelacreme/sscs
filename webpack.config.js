const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const pkg = require('./package.json')

const entry = [
  '@babel/polyfill',
  './src/index.js'
]

function createNonce (secret) {
  const buf = Buffer.from(secret || '', 'ascii')
  return `'${buf.toString('base64')}'`
}

const processCfg = {
  version: pkg.version,
  secret: pkg.secret
}

const config = {
  'process.config': JSON.stringify(processCfg),
  'process.nonce': createNonce(processCfg.secret),
  'process.test': process.env.TEST
}

const output = {
  filename: 'js/index.js',
  path: `${__dirname}/static`
}

const plugins = [
  new webpack.DefinePlugin(config)
]

const optimization = {}

const rules = [
  {
    test: /src\/(.*)\.json$/,
    loader: 'json-loader'
  },
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: require.resolve('babel-loader'),
    query: {
      presets: [
        ['@babel/preset-env', {
          exclude: ['transform-classes'],
          useBuiltIns: 'entry'
        }]
      ]
    }
  }
]

if (process.env.NODE_ENV === 'production') {
  optimization.minimizer = [
    new TerserPlugin({
      terserOptions: {
        keep_fnames: true,
        keep_classnames: true,
        mangle: false
      },
      parallel: true
    })
  ]

  plugins.push(
    new CompressionPlugin({
      algorithm: 'gzip'
    })
  )
}

module.exports = {
  target: 'web',
  entry,
  output,
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval',
  node: {
    __dirname: true,
    fs: 'empty'
  },
  plugins,
  optimization,
  stats: 'minimal',
  module: {
    rules
  }
}
