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

proxy.use((req, res, next) => {
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

                // Old CSRF tokens are still valid for 5 mins.
                if (req.session.csrfToken === csrfToken) {
                    next();
                } else if (req.session.oldCsrfToken != null
                    && req.session.refreshTimestamp != null
                    && req.session.oldCsrfToken === csrfToken
                    && moment().subtract(5, 'm').isSameOrBefore(req.session.refreshTimestamp)) {
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
