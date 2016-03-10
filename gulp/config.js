var _ = require('lodash');
var webpack = require('webpack');

var dest = "./public";
var src = "./src";
var serverDest = "./server";

var testSrc = "./tests";
var testDest = "./.tests";

var bowerSrc = "./bower_components";
var nodeSrc = "./node_modules";

var webpackConfig = require('./webpack.config')(src, bowerSrc, nodeSrc);

module.exports = {
    browserSync: {
        proxy: "http://localhost:8000",
        port: 4000,
        ui: {
            port: 4001
        }
    },
    nodemon: {
        script: serverDest + "/app.js",
        watch: [serverDest],
        env: {
            "PORT"                   : "8000",
            "API_BASE_URL"           : "http://localhost:8000/api",
            "CLIENT_SECRET"          : "TEST_SECRET"
        }
    },
    assets: {
        src: [
            src + "/assets/**/*",
            "!" + src + "/assets/{sass,sass/**,img,img/**,fonts,fonts/**}"
        ],
        dest: dest
    },
    sass: {
        src: [
            src + "/assets/sass/**/*.{sass,scss}",
            src + "/components/**/*.{sass,scss}"
        ],
        dest: dest + "/css",
        settings: {
            //indentedSyntax: true, // Enable .sass syntax!
            imagePath: dest + "/img", // Used by the image-url helper
            includePaths: [
                bowerSrc + "/bootstrap-sass/assets/stylesheets",
                bowerSrc + "/font-awesome/scss"
            ],
            outputStyle: "expanded"
        }
    },
    scripts: {
        src: [
            src + "/**/*.{js,jsx}"
        ],
        clientDest: dest + "/js",
        serverDest: serverDest,
        clientOptions: _.merge({
            entry: {
                app: src + "/app.js"
            },
            plugins: [
                new webpack.DefinePlugin({
                    __CLIENT__: true,
                    __SERVER__: false,
                    __DEVELOPMENT__: false
                }),
                new webpack.ProvidePlugin({
                    'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
                })
            ]
        }, webpackConfig),
        serverOptions: _.merge({
            entry: {
                app: src + "/server.js"
            },
            externals: /^[a-z\-0-9]+$/,
            output: {
                libraryTarget: 'commonjs2'
            },
            target: "node",
            node: {
                console: false,
                global: false,
                process: false,
                Buffer: false,
                __filename: false,
                __dirname: false
            },
            plugins: [
                new webpack.DefinePlugin({
                    __CLIENT__: false,
                    __SERVER__: true,
                    __DEVELOPMENT__: false
                })
            ]
        }, webpackConfig)
    },
    templates: {
        src: [
            src + "/templates/**/*.hbs"
        ],
        dest: "./views"
    },
    images: {
        src: [
            src + "/assets/img/**/*.{png,jpg,jpeg,gif,svg}",
            src + "/components/**/*.{png,jpg,jpeg,gif,svg}"
        ],
        dest: dest + "/img"
    },
    fonts: {
        src: [
            src + "/assets/fonts/**/*.{eot,svg,ttf,woff,woff2}",
            src + "/components/**/*.{eot,svg,ttf,woff,woff2}",
            bowerSrc + "/bootstrap-sass/assets/fonts/**/*.{eot,svg,ttf,woff,woff2}",
            bowerSrc + "/font-awesome/fonts/**/*.{eot,svg,ttf,woff,woff2}"
        ],
        dest: dest + "/fonts",
        filter: "**/*.{eot,svg,ttf,woff,woff2}"
    },
    markup: {
        src: src + "/**/*.html",
        dest: dest
    },
    clean: {
        folders: [
            dest,
            serverDest
        ]
    },
    production: {
        css: {
            src: dest + "/css/*.css",
            dest: dest + "/css"
        },
        script: {
            src: dest + "/js/*.js",
            dest: dest + "/js"
        }
    },
    test: {
        src: [
            testSrc + "/**/*.js"
        ],
        dest: testDest,
        mochaOptions: {},
        testOptions: {
            externals: /^[a-z\-0-9]+$/,
            output: {
                filename: 'all.js',
                libraryTarget: 'commonjs2'
            },
            module: {
                loaders: [
                    {
                        test: /\.jsx?$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader'
                    }
                ]
            },
            resolve: {
                // Tell webpack to look for required files in bower and node
                modulesDirectories: [bowerSrc, nodeSrc]
            }
        }
    }
};
