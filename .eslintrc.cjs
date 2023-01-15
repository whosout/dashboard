module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		project: './tsconfig.json',
	},

	plugins: ['@typescript-eslint'],

	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:react/recommended',
		'plugin:react/jsx-runtime',
		'plugin:react-hooks/recommended',
		'plugin:prettier/recommended',
	],

	settings: {
		react: {
			version: '18.2.0',
		},
	},

	rules: {
		'react/prop-types': 'off',
	},
}
