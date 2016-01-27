'use strict';

import _ from 'lodash';
import uuid from 'uuid';
import moment from 'moment';

import { Session, SessionStore } from './SessionStore';
import cookieConfig from '../configs/cookie';

const sessionStore = new SessionStore();

export default {

    loadSessionOnReq: function(req, res, next) {

        if (req.method === 'GET') {

            // Generate New CSRF Token to later usage
            var csrfToken = Session.generateCsrfToken();

            if ( !req.signedCookies.sessionId || _.isEmpty(req.signedCookies.sessionId) || req.signedCookies.sessionId === 'undefined' ) {

                //No cookie with sessionId, so create new session with new csrf token and attach it to cookie
                sessionStore.createSession({ csrfToken: csrfToken })
                    .then(session => {
                        res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                        res.cookie('csrfToken', session.state.csrfToken, _.defaults({ httpOnly: false }, cookieConfig.defaultOptions));
                        next();
                    })
                    .catch(error => {
                        next(error);
                    });

            } else {

                sessionStore.getSession(req.signedCookies.sessionId)
                    .then(existingSession => {

                        if (!existingSession) {
                            // has cookie, but no existing session
                            sessionStore.createSession({ csrfToken: csrfToken })
                                .then(session => {
                                    res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                                    res.cookie('csrfToken', session.state.csrfToken, _.defaults({ httpOnly: false }, cookieConfig.defaultOptions));
                                    next();
                                })
                                .catch(error => {
                                    next();
                                });

                        } else {

                            // has cookie, has existing session, so update the session state object
                            let newState = {
                                oldCsrfToken: existingSession.state.csrfToken,
                                csrfToken: csrfToken,
                                refreshTimestamp: moment()
                            };
                            // if there is access tokens stored in the session object, include it as well
                            if (existingSession.state.tokens) {
                                newState.tokens = existingSession.state.tokens;
                            }
                            existingSession.state = newState;

                            sessionStore.updateSession(existingSession)
                                .then(session => {
                                    res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                                    res.cookie('csrfToken', session.state.csrfToken, _.defaults({ httpOnly: false }, cookieConfig.defaultOptions));
                                    next();
                                })
                                .catch(error => {
                                    next(error);
                                });
                        }

                    });

            }

        } else {
            next(); //for non-GET method, continue to next middleware
        }

    }

}