
import _ from 'lodash';
import uuid from 'uuid';
import SessionStore from './SessionStore';
import cookieConfig from '../configs/cookie';

const sessionStore = new SessionStore();

export default {
    loadSessionOnReq: function(req, res, next) {

        console.log('sessionLoader.loadSessionOnReq is called', req.signedCookies, req.cookies);
        if (req.method == 'GET') {
            // Add/Update cookie
            var csrfToken = uuid.v4(); // TODO: use generation of csrf token
            //let session;
            //let isUpdate = false;
            if (_.isEmpty(req.signedCookies.sessionId)) {
                sessionStore.createSession({
                    csrfToken: csrfToken
                }).then(session => {
                    console.log("No cookie with sessionId, so add cookie & new session token", session);
                    res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                    res.cookie('csrfToken', session.state.csrfToken, _.defaults({ httpOnly: false }, cookieConfig.defaultOptions));
                    next();
                }).catch(error => {
                    console.log('create session store error', error);
                    next();
                });
            } else {

                sessionStore.getSession(req.signedCookies.sessionId)
                    .then(existingSession => {

                        if (!existingSession) { // false
                            sessionStore.createSession({
                                csrfToken: csrfToken
                            }).then(session => {
                                console.log("Has cookie, no existing session", session);
                                res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                                res.cookie('csrfToken', session.state.csrfToken, _.defaults({httpOnly: false}, cookieConfig.defaultOptions));
                                next();
                            }).catch(error => {
                                console.log('create session store error', error);
                                next();
                            });
                        } else {
                            // existing session, so update it
                            existingSession.state = {
                                csrfToken: csrfToken
                            };
                            console.log("Existing session", existingSession);
                            sessionStore.updateSession(existingSession)
                                .then(session => {
                                    console.log("Has cookie, retrieve session & Update session", session);
                                    res.cookie('sessionId', session.id, _.defaults({}, cookieConfig.defaultOptions));
                                    res.cookie('csrfToken', session.state.csrfToken, _.defaults({httpOnly: false}, cookieConfig.defaultOptions));
                                    next();
                                })
                                .catch(error => {
                                    console.log('update session store error', error);
                                    next();
                                });
                        }

                    });

            }

        } else {
            next();
        }
    }

}