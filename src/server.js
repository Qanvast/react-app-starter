'use strict';

/**
 * Module dependencies.
 */
import {default as _debug} from 'debug';
let debug = _debug('react-app-starter');

/**
 * Express app dependencies.
 */
import express, {Router as expressRouter} from 'express';
import cors from 'cors';
import hbs from 'express-handlebars';
import path from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';

import _ from 'lodash';
import chance from 'chance';

/**
 * Setup server app.
 */

let app = express();
import Router from './router';

// disable `X-Powered-By` HTTP header
app.disable('x-powered-by');

// view engine setup
app.engine('hbs', hbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'hbs');

app.use(favicon(path.join(__dirname, '../public/favicon.ico')));
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, '../public')));

app.use(cors());

let generator = chance();
const MAX_USERS = 1000;
let _users = [];

for (let i = 0; i <= MAX_USERS; i++) {
    _users.push({
        id: i,
        name: generator.name(),
        gender: generator.gender(),
        birthday: generator.birthday(),
        address: {
            line1: generator.address(),
            line2: generator.city()
        }
    });
}

let apiRouter = expressRouter();

apiRouter.get('/users', (req, res) => {
    let perPageCount = (req.query.per_page_count == null || req.query.per_page_count < 1) ? 10 : parseInt(req.query.per_page_count),
        page = (req.query.page == null || req.query.page < 0) ? 1 : parseInt(req.query.page),
        startIndex = (page - 1) * perPageCount,
        endIndex = startIndex + perPageCount;

    let users = _.slice(_users, startIndex, endIndex);

    users = users.map(user => {
        /**
         * TODO: Odd numbered users will contain the whole object, while even numbered users will only contain ID and name.
         * TODO: Remove this if you're not trying to learn React.
         */
        if (user.id % 2 === 1) {
            return user;
        } else {
            return {id: user.id, name: user.name};
        }
    });

    let response = {
        page: page,
        totalCount: MAX_USERS,
        perPageCount: perPageCount,
        data: users
    };

    res.json(response);
});

apiRouter.get('/user/:id', (req, res) => {
    let id = req.params.id;

    if (id == null || _users.length <= id) {
        res.status(500).send({error: 'Invalid user'});
    } else {
        res.json(_users[id]);
    }
});

app.use('/api', apiRouter);

// React App
app.use(Router.serve);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    let error = new Error('Not Found');
    error.status = 404;
    next(error);
});

/**
 * Get port from environment and store in Express.
 */
let port = process.env.PORT || '8000';
app.set('port', port);

/**
 * Create HTTP server.
 */
let server = app.listen(app.get('port'), () => {
    debug('Express server listening on port ' + server.address().port);
});
