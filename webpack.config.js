import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

import webpack from 'webpack'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin'

const { EnvironmentPlugin } = webpack

/**
 * Helpers
 */
const pathFromCurrentLocation = (path) =>
	fileURLToPath(new URL(path, import.meta.url))

const sourcePath = pathFromCurrentLocation('./src/')
const outputPath = pathFromCurrentLocation('./dist/')

// NOTE: workaround as import.meta.resolve is experimental
const require = createRequire(import.meta.url)
const resolveModule = (name) => require.resolve(name)

export default function (_, argv) {
	const isEnvDevelopment = argv.nodeEnv === 'development'
	const isEnvProduction = argv.nodeEnv === 'production'

	const resolveOptionsByEnvironment = ({ production, development }) =>
		isEnvProduction ? production : isEnvDevelopment && development

	/**
	 * Loaders
	 */
	const babelLoader = {
		loader: resolveModule('babel-loader'),

		options: {
			configFile: false,
			babelrc: false,

			presets: [
				[
					resolveModule('@babel/preset-env'),
					{
						bugfixes: true,
					},
				],
				[
					resolveModule('@babel/preset-typescript'),
					{
						isTSX: true,

						allExtensions: true,

						allowDeclareFields: isEnvProduction,
						optimizeConstEnums: isEnvProduction,
						onlyRemoveTypeImports: isEnvProduction,
					},
				],
				[
					resolveModule('@babel/preset-react'),
					{
						runtime: 'automatic',
						development: isEnvDevelopment,
					},
				],
			],

			inputSourceMap: isEnvDevelopment,
			sourceMaps: isEnvDevelopment,

			targets: {
				esmodules: true,
			},

			// NOTE: babel-loader specific options
			cacheDirectory: true,
			cacheCompression: false,
		},
	}

	/**
	 * Plugins
	 */
	const htmlPlugin = new HtmlWebpackPlugin({
		inject: true,
		scriptLoading: 'module',
		template: pathFromCurrentLocation('./public/index.html'),
	})

	const environmentPlugin = new EnvironmentPlugin(['NODE_ENV'])

	const forkTsCheckerPlugin = new ForkTsCheckerWebpackPlugin({
		logger: 'webpack-infrastructure',

		typescript: {
			mode: 'write-references',

			diagnosticOptions: {
				semantic: true,
				syntactic: true,
			},

			configFile: pathFromCurrentLocation('./tsconfig.json'),

			configOverwrite: {
				compilerOptions: {
					jsx: resolveOptionsByEnvironment({
						production: 'react-jsx',
						development: 'react-jsxdev',
					}),
				},
			},
		},
	})

	const reactRefreshPlugin = new ReactRefreshWebpackPlugin()

	const tsconfigPathsPlugin = new TsconfigPathsPlugin({
		configFile: pathFromCurrentLocation('./tsconfig.json'),
	})

	const plugins = [htmlPlugin, environmentPlugin, forkTsCheckerPlugin].concat(
		resolveOptionsByEnvironment({
			production: [],
			development: [reactRefreshPlugin],
		}),
	)

	return {
		context: sourcePath,

		entry: './main.tsx',

		output: {
			module: true,

			path: outputPath,
			pathinfo: isEnvDevelopment,

			filename: resolveOptionsByEnvironment({
				production: '[name].[contenthash:8].js',
				development: 'bundle.js',
			}),

			chunkFilename: resolveOptionsByEnvironment({
				production: '[name].[contenthash:8].chunk.js',
				development: '[name].chunk.js',
			}),

			assetModuleFilename: '[name].[hash][ext]',
		},

		module: {
			rules: [
				{
					oneOf: [
						{
							test: [/\.gif$/, /\.jpe?g$/, /\.png$/],
							type: 'asset',
						},
						{
							test: /\.(c|m)?tsx?$/,
							exclude: /node_modules/,
							use: [babelLoader],
						},
						// NOTE: mimics CRA behavior; see https://bit.ly/3JcuObf
						{
							exclude: [
								/^$/,
								/\.(cjs|mjs|js|jsx|cts|mts|ts|tsx)$/,
								/\.html$/,
								/\.json$/,
							],
							type: 'asset/resource',
						},
					],
				},
			],
		},

		resolve: {
			plugins: [tsconfigPathsPlugin],

			alias: {
				'react-redux': 'react-redux/es/next',
			},

			extensions: [
				'.cjs',
				'.mjs',
				'.js',
				'.jsx',
				'.cts',
				'.mts',
				'.ts',
				'.tsx',
			],
		},

		plugins,

		devServer: {
			hot: true,
			compress: true,
			historyApiFallback: true,

			client: {
				progress: true,
				reconnect: 3,

				overlay: {
					errors: true,
					warnings: false,
				},
			},
		},

		devtool: resolveOptionsByEnvironment({
			production: false,
			development: 'cheap-module-source-map',
		}),

		target: ['web', 'browserslist'],

		experiments: {
			outputModule: true,
			topLevelAwait: true,
		},
	}
}
