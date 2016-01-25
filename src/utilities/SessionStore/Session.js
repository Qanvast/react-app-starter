'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import moment from 'moment';
import uuid from 'uuid';
import validator from 'validator';

/**========================================
 * Utilities
 ========================================**/
import e from '../e';

class Session {
    constructor (state) {
        if (_.isPlainObject(state) && !_.isEmpty(state)) {
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

    static set id (id) {
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

export default Session;
