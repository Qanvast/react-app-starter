'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import { Router } from 'express';
import moment from 'moment';
import http from 'superagent';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';
import SessionStore from '../utilities/SessionStore';
import BaseAPI  from '../api/Base';
import cookieConfig from '../configs/cookie';

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
    let url = BaseAPI.constants.BASE_URL + req.url;
    console.log('calling ', url, " from proxy.post authenticate");
    http
        .post(url)
        .send(req.body)
        .set('application/json')
        .end(function(err, res){
            if (err) {
                return res.status(500).send(err);
            }
            if (res.accessToken) {
                sessionStore.createSession({
                    csrfToken: 'asdsadsadas12321ewdas',
                    accessToken: res.accessToken
                }).then(session => {

                    res.cookies('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                    res.cookies('csrfToken', session.csrfToken, _.defaults({}, cookieConfig.defaultOptions));
                    res.json({
                        accessToken: session.accessToken
                    });

                }).catch(error => {
                    res.status(500).send(error);
                });
            }
        });


    res.send('Received connect request.');
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
     *
     */


    console.log('proxy.use* is used');
    //http
    //    .get(req.params['0'])
    //    .withCredentials()
    //    .query(req.query)
    //    .use(BaseAPI.constants.BASE_URL)
    //    .timeout(BaseAPI.constants.TIMEOUT_MS)
    //    .end((err, response) => {
    //        //console.log('response from api', req.url, ' is ', response);
    //        res.json('response from ', BaseAPI.constants.BASE_URL, response);
    //    });

    res.send(`Received ${req.method} request.`);
});

export default proxy;
