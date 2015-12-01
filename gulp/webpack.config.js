module.exports = function (src, bowerSrc, nodeSrc) {
    return {
        output: {
            filename: "[name].js"
        },
        debug: true,
        watch: false,
        module: {
            preLoaders: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'eslint-loader'
                }
            ],
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['react', 'es2015']
                    }
                }
            ],
            noParse: /\.min\.js/
        },
        resolve: {
            // Tell webpack to look for required files in bower and node
            modulesDirectories: [bowerSrc, nodeSrc]
        }
    }
};
