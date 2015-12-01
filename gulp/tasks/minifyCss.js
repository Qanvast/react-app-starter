'use strict';

// Gulp & plugins
var gulp = require('gulp');
var minifyCSS = require('gulp-minify-css');
var size = require('gulp-filesize');

// Configs
var config = require('../config').production.css;

gulp.task('minifyCss', ['sass'], function () {
    return gulp.src(config.src)
        .pipe(minifyCSS({keepBreaks: true, processImport: false}))
        .pipe(gulp.dest(config.dest))
        .pipe(size());
});
