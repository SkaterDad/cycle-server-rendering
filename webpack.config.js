/*eslint-disable*/
var webpack = require('webpack'),
    path = require('path');

module.exports = {
    entry: './src/client.js',
    output: {
        path: path.join(__dirname, './dist'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel?cacheDirectory=true&presets=es2015'],
                exclude: /node_modules/,
            }
        ]
    },
    plugins: [
        new webpack.optimize.OccurenceOrderPlugin()
    ]
};
/*eslint-enable*/
