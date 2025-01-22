import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json' assert { type: 'json' };;
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'src/index.ts', // The entry point of your package
  output: [
    {
      dir: 'dist', // Specify the output directory
      format: 'cjs',
      sourcemap: true,
      exports: 'named', // Ensure named exports are supported
      inlineDynamicImports: true, // Ensures dynamic imports are inlined
    },
    {
      dir: 'dist', // Specify the output directory
      format: 'esm',
      sourcemap: true,
      exports: 'named', // Ensure named exports are supported
      inlineDynamicImports: true, // Ensures dynamic imports are inlined
    },
  ],
  plugins: [
    peerDepsExternal(), // Exclude peer dependencies from the bundle
    resolve(), // Resolve third-party modules
    commonjs(), // Convert CommonJS modules to ESModules
    typescript({ 
      tsconfig: './tsconfig.json',
      // useTsconfigDeclarationDir: true, // This is key to respect the declaration dir
      clean: true,                         // Clean cache
     }), // Use TypeScript
    postcss(),  // Handle CSS imports
    json(),     // Support for JSON files
    // terser(),   // Minify the output
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ], // Mark peerDependencies and dependencies as external
};
