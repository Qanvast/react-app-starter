'use strict';

// Gulp & plugins
var gulp = require('gulp');
var runSequeunce = require('run-sequence');

// Run this to compress all the things!
gulp.task('production', function (callback) {
    runSequeunce('clean', ['assets', 'minifyCss', 'uglifyJs', 'templates', 'images', 'fonts', 'markup'], callback);
});
