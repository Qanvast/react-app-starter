/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import uuid from 'uuid';
import { Router } from 'express';
import moment from 'moment';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';
import { Session, SessionStore } from '../utilities/SessionStore';
import cookieConfig from '../configs/cookie';
import ProxyAPI from '../api/Proxy';

/**========================================
 * Local variables
 ========================================**/
const proxy = Router();
const sessionStore = new SessionStore();

// Verify CSRF token for all incoming requests.
proxy.use((req, res, next) => {
    if (!_.isEmpty(req.signedCookies) && !_.isEmpty(req.signedCookies.sessionId)) {
        let csrfToken = req.get('x-csrf-token');

        if (_.isEmpty(csrfToken)) {
            csrfToken = req.get('x-xsrf-token');
        }

        if (_.isEmpty(csrfToken)) {
            next(e.throwForbiddenError());
        }

        // Retrieve session based on session ID and then verify CSRF token.
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
});

// Forward connect requests to API.
proxy.post(/^\/authentication\/(connect\/[a-z0-9]+(?:-[a-z0-9]+)?|register|reset-password)\/?$/i, (req, res, next) => {
    ProxyAPI
        .forward(req)
        .then(data => {
            if (_.has(data, 'tokens.token')
                && _.has(data, 'tokens.expiry')
                && _.has(data, 'tokens.refreshToken')) {
                return sessionStore.createSession(data.tokens);
            }
        })
        .then(session => {
            // NEVER INCLUDE access tokens in the cookie for security reasons.
            res.cookies('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
            res.cookies('csrfToken', session.csrfToken, _.defaults({httpOnly: false}, cookieConfig.defaultOptions));

            const data = _.cloneDeep(response.data);

            if (_.has(data, 'tokens')) {
                delete data.tokens;
            }

            res.json(data);
        })
        .catch(error => {
            next(e.throwBadRequestError(error.message, error));
        });
});

// Forward standard requests to API.
proxy.use((req, res, next) => {
    let promise;

    if (!req.session.hasValidAccessToken) {
        promise = ProxyAPI
            .refreshToken(req.session.state.refreshToken)
            .then((tokens) => {
                // Update the state and generate a new CSRF token.
                req.session.updateState(tokens);
                req.session.generateCsrfToken();

                // Update the session in the session store.
                return sessionStore.updateSession(req.session);
            })
            .then(() => {
                return ProxyAPI.forward(req);
            })
    } else {
        promise = ProxyAPI.forward(req);
    }

    promise
        .then(data => {
            res.cookies('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
            res.cookies('csrfToken', session.csrfToken, _.defaults({httpOnly: false}, cookieConfig.defaultOptions));

            res.json(data);
        });
});

// Top level error handler.
proxy.use((error, req, res, next) => {
    res
        .status(error.status || 500)
        .send(response);
});

export default proxy;
