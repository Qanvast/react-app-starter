/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import { Router } from 'express';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';
import { SessionStore } from '../utilities/SessionStore';
import cookieConfig from '../configs/cookie';
import ProxyAPI from '../api/Proxy';
import bodyParser from 'body-parser';

/**========================================
 * Local variables
 ========================================**/
const proxy = Router(); // eslint-disable-line new-cap
const sessionStore = new SessionStore();

proxy.use(bodyParser.json());

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
                if (session !== false && session.verifyCsrfToken(csrfToken)) {
                    req.session = session; // eslint-disable-line no-param-reassign

                    next();
                } else {
                    next(e.throwForbiddenError());
                }
            })
            .catch(error => {
                next(error);
            });
    } else {
        next(e.throwForbiddenError('Session information is missing.'));
    }
});

// Forward connect requests to API.
proxy.post(
    /^\/authentication\/(connect\/[a-z0-9]+(?:-[a-z0-9]+)?|register|reset-password)\/?$/i,
    (req, res, next) => {
        ProxyAPI
            .forward(req)
            .then(data => {
                if (_.has(data, 'tokens.token')
                    && _.has(data, 'tokens.expiry')
                    && _.has(data, 'tokens.refreshToken')) {
                    // Update the state and generate a new CSRF token.
                    req.session.updateAccessToken(
                        data.tokens.token,
                        data.tokens.expiry,
                        data.tokens.refreshToken
                    );
                    if (data.user && data.user.id) {
                        req.session.updateUserId(data.user.id);
                    }

                    req.session.generateCsrfToken();

                    return Promise.all([data, sessionStore.updateSession(req.session)]);
                }
            })
            .then(result => {
                const [ data, session ] = result;

                // NEVER INCLUDE access tokens in the cookie for security reasons.
                res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                res.cookie(
                    'csrfToken',
                    session.csrfToken,
                    _.defaults({ httpOnly: false, signed: false }, cookieConfig.defaultOptions)
                );

                const formattedData = _.cloneDeep(data);

                if (_.has(formattedData, 'tokens')) {
                    delete formattedData.tokens;
                }

                res.json(formattedData);
            })
            .catch(error => {
                next(e.throwBadRequestError(error.message, error));
            });
    });

// Forward standard requests to API.
proxy.use((req, res, next) => {
    let promise;

    if (!req.session.hasValidAccessToken && req.session.hasRefreshToken) {
        promise = ProxyAPI
            .refreshToken(req)
            .then((authorization) => {
                // Update the state and generate a new CSRF token.
                req.session.updateAccessToken(
                    authorization.token,
                    authorization.expiry,
                    authorization.refreshToken
                );
                req.session.generateCsrfToken();

                // Update the session in the session store.
                return sessionStore.updateSession(req.session);
            })
            .then(() => ProxyAPI.forward(req));
    } else {
        promise = ProxyAPI.forward(req);
    }

    promise
        .then(data => {
            res.cookie(
                'sessionId',
                req.session.id,
                _.defaults({}, cookieConfig.defaultOptions)
            );
            res.cookie(
                'csrfToken',
                req.session.csrfToken,
                _.defaults({ httpOnly: false, signed: false }, cookieConfig.defaultOptions)
            );

            res.json(data);
        })
        .catch(error => {
            next(error);
        });
});

// Top level error handler.
proxy.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
    const response = {
        message: (error.message != null) ?
            error.message : `Oops! This is embarrassing! Something went wrong!`,
        error
    };

    res
        .status(error.status || 500)
        .send(response);
});

/**
 * Middleware to load session based on cookie.
 *
 * @param req
 * @param res
 * @param next
 */
export function sessionLoader(req, res, next) {
    switch (req.method) {
        case 'GET':
            let promise;

            if (!req.signedCookies.sessionId
                || _.isEmpty(req.signedCookies.sessionId)
                || req.signedCookies.sessionId === 'undefined') {
                // No valid session in cookie, so create new session.
                promise = sessionStore.createSession();
            } else {
                // Retrieve session and check if its valid.
                promise = sessionStore
                    .getSession(req.signedCookies.sessionId)
                    .then(existingSession => {
                        if (existingSession === false) {
                            // No existing session so we should create a new session.
                            return sessionStore.createSession();
                        }

                        return existingSession;
                    });
            }

            promise
                .then(session => {
                    res.cookie(
                        'sessionId',
                        session.id,
                        _.defaults({}, cookieConfig.defaultOptions)
                    );
                    res.cookie(
                        'csrfToken',
                        session.csrfToken,
                        _.defaults({ httpOnly: false, signed: false }, cookieConfig.defaultOptions)
                    );
                    next();
                })
                .catch(error => {
                    next(error);
                });
            break;
        default:
            next();
            break;
    }
}

export default proxy;
