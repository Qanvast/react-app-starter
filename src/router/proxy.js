'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import {Router} from 'express';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';

let proxy = Router();

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

        // TODO Retrieve session from session storage and attach it to `req.session`.

        next();
    } else {
        // Reject
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
