'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import { Router } from 'express';
import moment from 'moment';
import http from 'superagent';
import url from 'url';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';
import SessionStore from '../utilities/SessionStore';
import cookieConfig from '../configs/cookie';
import GenericAPI from '../api/Generic';

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
        if (err || !response.data.accessToken) { return res.status(500).send({error: "Server error"}); }
        sessionStore.createSession({
            csrfToken: 'asdsadsadas12321ewdas',
            accessToken: response.data.accessToken
        }).then(session => {
            res.cookies('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
            res.cookies('csrfToken', session.csrfToken, _.defaults({}, cookieConfig.defaultOptions));
            res.json({
                accessToken: session.accessToken
            });
        }).catch(error => {
            res.status(500).send({error: error.message});
        });
    });

});

proxy.use('*', (req, res, next) => {
    // TODO Retrieve API access tokens from `req.session`.
    /**
     * 1.) Get API Access Token
     * 2.) If Token Valid: go to 3; else 7
     * 3.) Fire Request to API
     * 4.) Parse Response
     * 5.) If response is successfull && session refreshed: prepare cookie with new CSRF token and session ID; else go to 9
     * 6.) Send refresh request
     * 7.) if Refresh successful: go to 8; else 9
     * 8.) replace stored tokens with refreshed tokens n go to 3
     * 9.) return error response with cookie
     */
    // TODO: complete check valid token algorithm (Step 2)
    let isAccessTokenValid = (token) => {
        return true;
    };
    // TODO: complete refreshing the expired/invalid token (Step 8)
    let refreshAccessToken = (oldtoken) => {
        let refreshedToken = "asdasd";
        return refreshedToken;
    };
    var reqBody = req.body ? req.body : {};
    if (  !reqBody.accessToken || (reqBody.accessToken && !isAccessTokenValid(reqBody.accessToken))  ) {
        // if no access token, or has invalid token
        return res.status(500).send({error: "Missing access token in request body"});
    } else {
        // API Token is Valid
        GenericAPI.sendRequestToApi(req, function(err, response){
            if (err && !response) { return res.status(500).send({error: err.message}); }
            return res.json(response);
        });
    }

});

export default proxy;
