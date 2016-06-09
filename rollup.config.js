import babel from 'rollup-plugin-babel';

export default {
  plugins: [ babel() ],
  sourceMap: true,
  format: 'umd',
  globals: {
    fs: 'fs',
    http: 'http',
    mkdirp: 'mkdirp'
  }
}
