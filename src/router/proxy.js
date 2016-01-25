'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import { Router } from 'express';
import moment from 'moment';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';
import SessionStore from '../utilities/sessionStore';

let proxy = Router();

const sessionStore = new SessionStore();
const ignoredMethods = ['GET', 'HEAD', 'OPTIONS'];

proxy.use((req, res, next) => {
    if (_.indexOf(ignoredMethods, req.method.toUpperCase()) < 0) {
        if (!_.isEmpty(req.signedCookies) && !_.isEmpty(req.signedCookies.sessionId)) {
            // Retrieve session based on session ID and then get the CSRF token.
            let csrfToken = req.get('x-csrf-token');

            if (_.isEmpty(csrfToken)) {
                csrfToken = req.get('x-xsrf-token');
            }

            if (_.isEmpty(csrfToken)) {
                next(e.throwForbiddenError());
            }

            sessionStore
                .getSession(req.signedCookies.sessionId)
                .then(session => {
                    req.session = session;

                    if (req.session.verifyCsrfToken(csrfToken)) {
                        next();
                    } else {
                        next(e.throwForbiddenError());
                    }
                })
                .catch(error => {
                    next(error);
                });
        } else {
            next(e.throwForbiddenError());
        }
    } else {
        next(); // Ignored method.
    }
});

proxy.post(/^\/authentication\/(connect\/[a-z0-9]+(?:-[a-z0-9]+)?|register|reset-password)\/?$/i, (req, res, next) => {
    console.log(`Proxy received connect request.`);

    res.send('Received connect request.');
});

proxy.use('*', (req, res, next) => {
    // TODO Retrieve API access tokens from `req.session`.
    res.send(`Received ${req.method} request.`);
});

export default proxy;
