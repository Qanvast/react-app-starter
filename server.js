#!/usr/bin/env node

/**
 * Module dependencies.
 */
var debug = require('debug')('react-app-starter');
var http = require('http');

/**
 * Express app dependencies.
 */
var express = require('express');
var hbs  = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');

/**
 * Install JSX files.
 */

require('node-jsx').install({extension: '.jsx'});

/**
 * Setup server app.
 */

var router = require('./src/routes').router;

var app = express();

// disable `X-Powered-By` HTTP header
app.disable('x-powered-by');

// view engine setup
app.engine('hbs', hbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// TODO: uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, './public')));
app.use(router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}