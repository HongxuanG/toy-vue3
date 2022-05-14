import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'
export default {
  input: './src/index.ts',
  output: [
    {
      file: './lib/guide-toy-vue3.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: './lib/guide-toy-vue3.esm.js',
      format: 'es',
      sourcemap: true,
    }
  ],
  plugins: [typescript()]
}
