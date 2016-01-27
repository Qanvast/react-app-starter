

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
import e from '../utilities/e';
import { Session, SessionStore } from '../utilities/SessionStore';
import cookieConfig from '../configs/cookie';
import GenericAPI from '../api/Generic';

const proxy = Router();

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

    /**
     * 1.) Fire Request to API
     * 2.) Parse Response
     * 3.) If Success, go to 4; else go to 8
     * 4.) If has success token, go to 5, else 7
     * 5.) Strip response of tokens
     * 6.) Prepare Cookie with new CSRF token and session ID
     * 7.) Return response with Cookie
     * 8.) Return error response with cookie
     */

    GenericAPI.sendRequestToApi(req, (err, response) => {
        if (err) { return res.status(500).send({ error: err }); }

        let sessionState = {
            csrfToken: Session.generateCsrfToken()
        };

        if (response.data.tokens) {
            // store the access tokens ({token,expiry,refreshToken}) in the session state
            sessionState.tokens =  response.data.tokens;
        }

        sessionStore.createSession(sessionState)
            .then(session => {

                // DO NOT INCLUDE access tokens in the cookie for security reason
                res.cookies('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                res.cookies('csrfToken', session.csrfToken, _.defaults({}, cookieConfig.defaultOptions));

                // also include the access tokens in the response body, just in case client need it
                res.json({
                    session: session,
                    tokens: response.data.tokens
                });
            })
            .catch(error => {
                res.status(500).send({ error: error });
            });
    });
});

proxy.use('*', (req, res) => {
    // TODO Retrieve API access tokens from `req.session`.
    /**
     * 1.) Get API Access Token
     * 2.) If Token Valid: go to 3; else 7
     * 3.) Fire Request to API
     * 4.) Parse Response
     * 5.) If response is successful && session refreshed: 6 ; else go to 10
     * 6.) Prepare cookie with new CSRF token and session ID
     * 7.) Send refresh request
     * 8.) if Refresh successful: go to 9; else 10
     * 9.) replace stored tokens with refreshed tokens n go to 3
     * 10.) return error response with cookie
     */

    // Only GET Method is allowed
    if (req.method !== 'GET') {
        next(e.throwForbiddenError());
    }

    // to check token expiry
    var isAccessTokenValid = (tokens) => {
        if ( _.isObject(tokens) && tokens.expiry && tokens.token) {
            var expiryDate = moment(tokens.expiry);
            if (moment().isBefore(expiryDate, 'second')) {
                return true;
            }
        }
        return false;
    };

    // TESTING ONLY, remove when User API is working
    req.query.accessToken = uuid.v4();
    req.query.tokenExpiryDate = moment().toISOString();
    req.query.refreshToken = uuid.v4();

    // since it is only for GET request, can only pass the tokens through URL query parameters
    // (e.g. GET /users?page=1&page_per_count=2&token=12312&expiry=121215&refreshToken=asdsadsa)
    if ( !(req.query.accessToken && req.query.tokenExpiryDate && req.query.refreshToken) ) {
        return res.status(500).send({ error: 'Missing accessToken, tokenExpiryDate, and refreshToken field in URL query parameters' });
    }

    let tokens = {
        token: req.query.accessToken,
        expiry: req.query.tokenExpiryDate,
        refreshToken: req.query.refreshToken
    };

    let fireActionToApiWithNewSession = (newSessionState) => {

        GenericAPI.sendRequestToApi(req, function(err, response){
            if (err && !response) { next(e.throwServerError); }
            if (newSessionState) {
                // session/token is refreshed
                sessionStore.createSession(newSessionState)
                    .then(session => {
                        res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                        res.cookie('csrfToken', session.state.csrfToken, _.defaults({ httpOnly: false }, cookieConfig.defaultOptions));
                        res.json(response);
                    })
                    .catch(error => next(error));
            } else {
                return res.json(response);
            }
        });

    };

    // tokens must be in { token:, expiry:, refreshToken:} format
    if (!isAccessTokenValid(tokens)) {

        // invalid token, send refresh token request
        GenericAPI.sendRefreshTokenRequest(tokens, function(err, newTokens){
            if (err && !newTokens) { next(e.throwServerError); }
            if (!err && newTokens) {

                let newSessionState = {
                    csrfToken: Session.generateCsrfToken(),
                    tokens: newTokens
                };
                // return the response with the new session state (new csrf and tokens)
                fireActionToApiWithNewSession(newSessionState);
            }
        });

    } else {
        // API Token is Valid
        fireActionToApiWithNewSession(null);
    }

});

export default proxy;
