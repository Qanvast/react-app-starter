'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import keyMirror from 'fbjs/lib/keyMirror'
import redis from 'redis';
import uuid from 'uuid';
import validator from 'validator';

/**========================================
 * Utilities
 ========================================**/
import e from './e';

/**========================================
 * Configs
 ========================================**/
import cookieConfig from '../configs/cookie';

const DEFAULT_OPTIONS = {
    session: {
        maxAge: cookieConfig.defaultOptions.maxAge +  5 * 60 // Cookie's maxage + 5 mins
    },
    redis: {
        host: 'localhost',
        port: 6379
    }
};

function generateSessionKey (id) {
    return `session:${id}`;
}

class SessionStore {
    constructor (options) {
        this.options = _.defaults({}, options, DEFAULT_OPTIONS);
        this.client = redis.createClient(this.options.redis);
    };

    createSession (state) {
        if (_.isPlainObject(state) && !_.isEmpty(state)) {
            let newSessionId = uuid.v4();

            state.id = newSessionId;

            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(generateSessionKey(newSessionId), JSON.stringify(state), 'NX', 'EX', this.options.session.maxAge, (error, response) => {
                        if (!error) {
                            if (response === 'OK') {
                                resolve(state);
                            } else {
                                reject(e.throwServerError('Session already exists.'));
                            }
                        } else {
                            reject(error);
                        }
                    });
            });
        } else {
            return Promise.reject(e.throwServerError('Invalid session state.'));
        }
    }

    /**
     * Retrieves session from store based on provided session ID.
     * If session does not exist, `false` is returned.
     *
     * @param id Session ID
     * @returns {boolean|object}
     */
    getSession (id) {
        if (validator.isUUID(id, '4')) {
            return new Promise((resolve, reject) => {
                this
                    .client
                    .get(generateSessionKey(id), (error, session) => {
                        if (!error) {
                            if (session != null) {
                                try {
                                    session = JSON.parse(session);

                                    if (_.isPlainObject(session) && !_.isEmpty(session)) {
                                        resolve(session);
                                    } else {
                                        reject(e.throwServerError('Session is corrupted.'));
                                    }
                                } catch (parseError) {
                                    reject(parseError);
                                }
                            } else {
                                reject(e.throwServerError('Invalid session ID.'));
                            }

                        } else {
                            reject(error);
                        }
                    });
            });
        } else {
            return Promise.reject(e.throwServerError('Invalid session ID.'));
        }
    }

    /**
     * Replaces session state in store for session specified.
     *
     * @param state New session state to merge with existing session
     * @param id Session ID
     */
    updateSession (id, state) {
        if (_.isPlainObject(state) && validator.isUUID(id, '4')) {
            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(generateSessionKey(id), JSON.stringify(state), 'XX', 'EX', this.options.session.maxAge, (error, response) => {
                        if (!error) {
                            if (response === 'OK') {
                                resolve(true);
                            } else {
                                reject(e.throwServerError('Session does not exist.'));
                            }
                        } else {
                            reject(error);
                        }
                    });
            });
        } else {
            return Promise.reject(e.throwServerError('Invalid session information.'));
        }
    }
}

export default SessionStore;
