'use strict';

// Gulp & plugins
var gulp = require('gulp');
var webpack = require('webpack-stream');

// BrowerSync
var browserSync = require('browser-sync');

// Utilities
var handleErrors = require('../util/handleErrors');

// Configs
var config = require('../config').scripts;

gulp.task('script', ['script:client', 'script:server']);

gulp.task('script:client', function () {
    return gulp.src(config.src)
        .pipe(webpack(config.clientOptions))
        .on('error', handleErrors)
        .pipe(gulp.dest(config.clientDest))
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('script:server', function () {
    return gulp.src(config.src)
        .pipe(webpack(config.serverOptions))
        .on('error', handleErrors)
        .pipe(gulp.dest(config.serverDest));
});
