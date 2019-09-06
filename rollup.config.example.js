import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sharp from 'rollup-plugin-sharp';

const production = !process.env.ROLLUP_WATCH;

export default [{
	input: 'example/client.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'example/public/client.js'
	},
	plugins: [
		svelte({
			dev: !production,
			css: css => {
				css.write('example/public/client.css');
      },
      hydratable: true
		}),
		resolve({
			browser: true,
			dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		}),
		commonjs(),
		sharp({ publicPath: 'example/public/' }),
		!production && livereload('example/public'),
		production && terser()
	],
	watch: {
		clearScreen: false
	}
},{
	input: 'example/server.js',
	output: {
		sourcemap: true,
		format: 'cjs',
		name: 'app',
		file: 'example/dist/server.js'
	},
	plugins: [
		svelte({
			dev: !production,
      generate: 'ssr',
			css: css => {
				css.write('example/public/bundle.css');
			}
		}),
		// resolve({
		// 	browser: true,
		// 	dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/')
		// }),
		commonjs(),
		sharp({ publicPath: 'example/public/' }),
		// production && terser()
	],
	watch: {
		clearScreen: false
	}
}];
