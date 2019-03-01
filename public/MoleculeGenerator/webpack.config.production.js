var path = require('path');
var webpack = require('webpack');

module.exports = {
	entry: './src/index.js',
	
	output: {
		filename: 'static/bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: '/'
	},
	
	devtool: 'source-map',
	
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				use: ['babel-loader'],
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	
	optimization: {
		minimize: true
	}
};
