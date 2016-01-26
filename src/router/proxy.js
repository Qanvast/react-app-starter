'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import { Router } from 'express';
import moment from 'moment';
import http from 'superagent';
import url from 'url';
import axios from 'axios';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';
import SessionStore from '../utilities/SessionStore';
import cookieConfig from '../configs/cookie';

let proxy = Router();

const sessionStore = new SessionStore();
const ignoredMethods = ['GET', 'HEAD', 'OPTIONS'];


var axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 1000
});


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

    let reqUrl = req.params[0];
    let reqQuery = req.query ? req.query : {};
    let reqBody = req.body ? req.body : {};

    const successResponse = (response) => {
        console.log('calling /api success: ', response);
        if (response.statusText == 'OK' && response.data) {
            if (response.data.accessToken) {

                // if has access token, create new session with new csrf token and store the access token as well
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
                    res.status(500).send(error);
                });

            }
        } else {
            res.status(response.status).send({error: response.statusText});
        }
    };

    const errorResponse = (error) => {
        if (error instanceof Error) {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error);
            res.status(500).send({error: error.message});
        } else {
            // The request was made, but the server responded with a status code
            // that falls out of the range of 2xx
            console.log('Out of 2xx range', error);
            res.status(error.status).send({error: error.data});
        }
    };

    axiosInstance.request({
        method: req.method,
        url: reqUrl,
        withCredentials: true,
        params: reqQuery,
        data: reqBody
    }).then(successResponse).catch(errorResponse);

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

    //passRequestToAPI(req)
    //    .then(responseBody => {
    //        console.log('response.body from superagent', responseBody);
    //        res.json(responseBody)
    //    })
    //    .catch(error => {
    //        console.log('error response from superagent', error);
    //        res.status(error.status).send(error.response);
    //    });

    // TODO: move this into a singleton class?
    let reqUrl = req.params[0];
    let reqQuery = req.query ? req.query : {};
    let reqBody = req.body ? req.body : {};

    axiosInstance.request({
        method: req.method,
        url: reqUrl,
        withCredentials: true,
        params: reqQuery,
        data: reqBody
    }).then(function(response) {
        if (response.statusText == 'OK' && response.data) {
            res.json(response.data);
        } else {
            res.status(response.status).send({error: response.statusText});
        }
    }).catch(function (response) {
        if (response instanceof Error) {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', response);
            res.status(500).send({error: response.message});
        } else {
            // The request was made, but the server responded with a status code
            // that falls out of the range of 2xx
            console.log('Out of 2xx range', response);
            res.status(response.status).send({error: response.data});
        }
    });

});

export default proxy;
