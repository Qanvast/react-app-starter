
/**
 * Module dependencies.
 */
import { default as _debug } from 'debug';
const debug = _debug('react-app-starter');

/**
 * Express app dependencies.
 */
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from './utilities/cors';
import hbs from 'express-handlebars';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';

// import _ from 'lodash';

/**
 * Utilities
 */
// import e from './utilities/e';

/**
 * Configs
 */
import cookieConfig from './configs/cookie';

/**========================================
 * Bootstrapping Express.js App
 ========================================**/
const app = express();

const env = app.get('env').toLowerCase();

// disable `X-Powered-By` HTTP header
app.disable('x-powered-by');

// Enable proxy
app.enable('trust proxy');

// view engine setup
app.engine('hbs', hbs({ defaultLayout: 'main', extname: '.hbs' }));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, '../public/favicon.ico')));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(cookieParser(cookieConfig.secret));

/**========================================
 * Bootstrapping CORS
 ========================================**/
app.options('*', cors(env));
app.use(cors(env));

/**========================================
 * Proxy API
 ========================================**/
import proxy from './router/proxy';

app.use('/proxy', proxy);

/**========================================
 * Simulate an API (THIS SHOULD BE REMOVED IN PROD)
 *
 * We're packaging a mock API here for convenience.
 ========================================**/
import api from './router/api';

app.use('/api', api);

/**========================================
 * React app
 ========================================**/
import sessionLoader from './utilities/sessionLoader';
import Router from './router';

app.use(sessionLoader.loadSessionOnReq, Router.serve);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '8000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = app.listen(app.get('port'), () => {
    debug('Express server listening on port ' + server.address().port);
});
