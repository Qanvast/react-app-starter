var _ = require('lodash');

var dest = "./public";
var src = "./src";
var serverDest = "./server";

var bowerSrc = "./bower_components";
var nodeSrc = "./node_modules";

var webpackConfig = require('./webpack.config')(src, bowerSrc, nodeSrc);

module.exports = {
    browserSync: {
        proxy: "http://localhost:8080",
        port: 4000,
        ui: {
            port: 4001
        }
    },
    nodemon: {
        script: serverDest + "/server.js",
        watch: [serverDest]
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
                bowerSrc + "/bootstrap-sass-official/assets/stylesheets"
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
            }
        }, webpackConfig),
        serverOptions: _.merge({
            entry: {
                server: src + "/server.js"
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
            }
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
            src + "/components/**/*.{eot,svg,ttf,woff,woff2}"
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
        cssSrc: dest + "/css/*.css",
        jsSrc: dest + "/js/*.js",
        jslint: {
            options: {
                node: true
            }
        },
        dest: dest
    }
};
