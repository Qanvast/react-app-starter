/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import redis from 'redis';
import validator from 'validator';

import Session from './Session';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';

/**========================================
 * Configs
 ========================================**/
import cookieConfig from '../../configs/cookie';

const DEFAULT_OPTIONS = {
    session: {
        maxAge: cookieConfig.defaultOptions.maxAge + 5 * 60 // Cookie's maxage + 5 mins
    },
    redis: {
        host: 'localhost',
        port: 6379
    }
};

class SessionStore {
    constructor(options) {
        this.options = _.defaults({}, options, DEFAULT_OPTIONS);
        this.client = redis.createClient(this.options.redis);
    }

    createSession(state) {
        if (_.isPlainObject(state) || _.isEmpty(state)) {
            const session = new Session(state);

            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(session.key, session.toString(), 'NX', 'EX',
                        this.options.session.maxAge, (error, response) => {
                            if (!error) {
                                if (response === 'OK') {
                                    resolve(session);
                                } else {
                                    reject(e.throwServerError('Session already exists.'));
                                }
                            } else {
                                reject(error);
                            }
                        });
            });
        }

        return Promise.reject(e.throwServerError('Invalid session state.'));
    }

    /**
     * Retrieves session from store based on provided session ID.
     * If session does not exist, `false` is returned.
     *
     * @param id Session ID
     * @returns {boolean|object}
     */
    getSession(id) {
        if (validator.isUUID(id, '4')) {
            return new Promise((resolve, reject) => {
                this
                    .client
                    .get(Session.generateKey(id), (error, sessionState) => {
                        if (!error) {
                            if (sessionState != null) {
                                try {
                                    const session = new Session(sessionState);
                                    resolve(session);
                                } catch (newError) {
                                    reject(newError);
                                }
                            } else {
                                resolve(false);
                            }
                        } else {
                            reject(error);
                        }
                    });
            });
        }

        return Promise.reject(e.throwServerError('Invalid session ID.'));
    }

    /**
     * Replaces session state in store for session specified.
     *
     * @param session New session to replace current session
     */
    updateSession(session) {
        if (session instanceof Session) {
            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(Session.generateKey(session.id), session.toString(), 'XX', 'EX',
                        this.options.session.maxAge, (error, response) => {
                            if (!error) {
                                if (response === 'OK') {
                                    resolve(session);
                                } else {
                                    reject(e.throwServerError('Session does not exist.'));
                                }
                            } else {
                                reject(error);
                            }
                        });
            });
        }

        return Promise.reject(e.throwServerError('Invalid session information.'));
    }
}

export default SessionStore;
