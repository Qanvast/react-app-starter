'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import moment from 'moment';
import uuid from 'uuid';
import validator from 'validator';
import Tokens from 'csrf';
import crypto from 'crypto';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';
import csrfConfig from '../../configs/csrf';

var tokens = new Tokens();

class Session {
    constructor(state) {
        if (_.isPlainObject(state)) {
            this._state = _.cloneDeep(state);
        } else {
            if (_.isString(state)) {
                try {
                    this._state = JSON.parse(state);

                    if (_.has(this._state, 'authorization.expiry')) {
                        this._state.authorization.expiry = moment(this._state.authorization.expiry);
                    }

                    if (_.has(this._state, 'refreshTimestamp')) {
                        this._state.refreshTimestamp = moment(this._state.refreshTimestamp);
                    }
                } catch (error) {
                    throw e.throwServerError('Session is corrupted.');
                }

                if (!_.isPlainObject(this._state) || _.isEmpty(this._state)) {
                    throw e.throwServerError('Session is corrupted.');
                }
            } else {
                this._state = {};
            }
        }

        // Check if a csrf token exists and generate one if necessary.
        if (!_.isString(this._state.csrfToken) || _.isEmpty(this._state.csrfToken)) {
            this._state.csrfToken = tokens.create(csrfConfig.secret);
        }

        // Check existing state's ID and generate new ID if necessary.
        if (this._state.id != null && validator.isUUID(this._state.id, '4')) {
            this._id = this._state.id;
        } else {
            this._id = uuid.v4();
        }

        delete this._state.id; // We don't need another ID copy.
    }

    /**
     * Generates a unique key to represent this session based on the session ID provided.
     * @returns String
     */
    static generateKey(id) {
        return `session:${id}`;
    }

    /**
     * Refreshes the session's CSRF token.
     */
    generateCsrfToken() {
        let oldCsrfToken = this._state.csrfToken;
        let refreshTimestamp = moment();

        this._state.csrfToken = tokens.create(csrfConfig.secret);

        if (_.isString(oldCsrfToken) && !_.isEmpty(oldCsrfToken)) {
            this._state.oldCsrfToken = oldCsrfToken;
            this._state.refreshTimestamp = refreshTimestamp;
        }

        return this._state.csrfToken;
    }

    verifyCsrfToken(csrfToken) {
        // Old CSRF tokens are still valid for 5 mins.
        return (
            tokens.verify(csrfConfig.secret, csrfToken)
            || (this._state.oldCsrfToken != null  && this._state.refreshTimestamp != null && this._state.oldCsrfToken === csrfToken && moment().subtract(5, 'm').isSameOrBefore(this._state.refreshTimestamp))
        );
    }

    updateAccessToken(token, expiry, refreshToken) {
        this._state.authorization = {
            token,
            expiry: moment(expiry),
            refreshToken
        };
    }

    get id() {
        return this._id;
    }

    static set id(id) {
        throw e.throwServerError('Session ID is immutable.');
    }

    /**
     * Generates a unique key to represent this session based on the session ID.
     * @returns String
     */
    get key() {
        return Session.generateKey(this._id);
    }

    get csrfToken() {
        return this._state.csrfToken;
    }

    set csrfToken(csrfToken) {
        throw e.throwServerError('Unsupported! Please use the `session.generateCsrfToken()` method.');
    }

    get accessToken() {
        return this._state.authorization.token;
    }

    static set accessToken(token) {
        throw e.throwServerError('Unsupported! Please use the `session.updateAccessToken()` method.');
    }

    get hasValidAccessToken() {
        return (_.has(this._state, 'authorization.token')
            && _.isString(this._state.authorization.token)
            && !_.isEmpty(this._state.authorization.token)
            && _.has(this._state, 'authorization.expiry')
            && this._state.authorization.expiry instanceof moment
            && this._state.authorization.expiry.isValid()
            && moment().isSameOrBefore(this._state.authorization.expiry));
    }

    get refreshToken() {
        return this._state.authorization.refreshToken;
    }

    static set refreshToken(token) {
        throw e.throwServerError('Unsupported! Please use the `session.updateAccessToken()` method.');
    }

    get hasRefreshToken() {
        return (_.has(this._state, 'authorization.refreshToken')
            && _.isString(this._state.authorization.refreshToken)
            && !_.isEmpty(this._state.authorization.refreshToken));
    }

    get state() {
        return _.cloneDeep(this._state);
    }

    static set state(state) {
        throw e.throwServerError('Session state is immutable.');
    }

    /**
     * Merges the new state with the existing state.
     * @param newState
     */
    //updateState(state) {
    //    _.merge(this._state, state);
    //}

    toString() {
        var snapshot =  _.cloneDeep(this._state);

        snapshot.id = this._id;

        if (_.has(snapshot, 'authorization.expiry')) {
            snapshot.authorization.expiry = snapshot.authorization.expiry.valueOf();
        }

        if (_.has(snapshot, 'refreshTimestamp')) {
            snapshot.refreshTimestamp = snapshot.refreshTimestamp.valueOf();
        }


        return JSON.stringify(snapshot);
    }
}

export default Session;
