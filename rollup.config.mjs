import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default [
  {
    input: {
      index: 'src/index.ts',
    },
    output: [
      {
        dir: 'dist',
        format: 'esm',
        entryFileNames: '[name].esm.js',
      },
      {
        dir: 'dist',
        format: 'umd',
        name: 'Avatar',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [
      del({ targets: 'dist/*' }),
      terser(),
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: [
          '**/*.test.tsx',
          '**/*.test.ts',
          '**/*.stories.ts',
          'examples/**',
        ],
      }),
      copy({
        targets: [
          { src: 'README.md', dest: 'dist' },
          { src: 'package.json', dest: 'dist' },
        ],
      }),
    ],
    onwarn: (warning, next) => {
      if (
        (warning.id && /node_modules/.test(warning.id)) ||
        (warning.ids && warning.ids.every((id) => /node_modules/.test(id)))
      ) {
        return;
      }

      next(warning);
    },
  },
];
