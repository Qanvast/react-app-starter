'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import keyMirror from 'fbjs/lib/keyMirror';
import moment from 'moment';
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

class Session {
    constructor (state) {
        if (_.isPlainObject && !_.isEmpty(state)) {
            this._state = _.cloneDeep(state);
        } else if (_.isString(state)) {
            try {
                this._state = JSON.parse(state);
            } catch (error) {
                throw e.throwServerError('Session is corrupted.');
            }

            if (!_.isPlainObject(this._state) || _.isEmpty(this._state)) {
                throw e.throwServerError('Session is corrupted.');
            }
        }

        if (state.id != null && validator.isUUID(state.id, '4')) {
            this._id = id;
        } else {
            this._id = uuid.v4();
        }

        delete this._state.id; // We don't need another ID copy.
    }

    static generateKey (id) {
        return `session:${id}`;
    }

    get key () {
        return Session.generateKey(this._id);
    }

    verifyCsrfToken (csrfToken) {
        // Old CSRF tokens are still valid for 5 mins.
        return false;

        //return (
        //    this._state.oldCsrfToken != null
        //    && this._state.refreshTimestamp != null
        //    && this._state.oldCsrfToken === csrfToken
        //    && moment().subtract(5, 'm').isSameOrBefore(this._state.refreshTimestamp)
        //);
    }

    get id () {
        return this._id;
    }

    set id (id) {
        throw e.throwServerError('Session ID is immutable.');
    }

    get state () {
        return _.cloneDeep(this._state);
    }

    set state (state) {
        this._state = _.cloneDeep(state);
    }

    toString() {
        var snapshot =  _.cloneDeep(this._state);

        snapshot.id = this._id;

        return snapshot.toString();
    }
}

class SessionStore {
    constructor (options) {
        this.options = _.defaults({}, options, DEFAULT_OPTIONS);
        this.client = redis.createClient(this.options.redis);
    };

    createSession (state) {
        if (_.isPlainObject(state) && !_.isEmpty(state)) {
            let session = new Session(state);

            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(session.key, session.toString(), 'NX', 'EX', this.options.session.maxAge, (error, response) => {
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
                    .get(Session.generateKey(id), (error, sessionState) => {
                        if (!error) {
                            if (sessionState != null) {
                                try {
                                    let session = new Session(sessionState);

                                    resolve(session);
                                } catch (error) {
                                    reject(error);
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
     * @param session New session state
     * @param id Session ID
     */
    updateSession (session) {
        if (session instanceof Session && validator.isUUID(id, '4')) {
            return new Promise((resolve, reject) => {
                this
                    .client
                    .set(Session.generateKey(id), session.toString(), 'XX', 'EX', this.options.session.maxAge, (error, response) => {
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
