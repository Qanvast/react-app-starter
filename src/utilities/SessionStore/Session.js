/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import moment from 'moment';
import uuid from 'uuid';
import validator from 'validator';
import Tokens from 'csrf';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';
import csrfConfig from '../../configs/csrf';

const tokens = new Tokens();

class Session {
    constructor(state) {
        if (_.isPlainObject(state)) {
            this.stateObj = _.cloneDeep(state);
        } else {
            if (_.isString(state)) {
                try {
                    this.stateObj = JSON.parse(state);

                    if (_.has(this.stateObj, 'refreshTimestamp')) {
                        this.stateObj.refreshTimestamp = moment(this.stateObj.refreshTimestamp);
                    }
                } catch (error) {
                    throw e.throwServerError('Session is corrupted.');
                }

                if (!_.isPlainObject(this.stateObj) || _.isEmpty(this.stateObj)) {
                    throw e.throwServerError('Session is corrupted.');
                }
            } else {
                this.stateObj = {};
            }
        }

        // Check if a csrf token exists and generate one if necessary.
        if (!_.isString(this.stateObj.csrfToken) || _.isEmpty(this.stateObj.csrfToken)) {
            this.stateObj.csrfToken = tokens.create(csrfConfig.secret);
        }

        // Check existing state's ID and generate new ID if necessary.
        if (this.stateObj.id != null && validator.isUUID(this.stateObj.id, '4')) {
            this.idFromStateObj = this.stateObj.id;
        } else {
            this.idFromStateObj = uuid.v4();
        }

        delete this.stateObj.id; // We don't need another ID copy.
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
        const oldCsrfToken = this.stateObj.csrfToken;
        const refreshTimestamp = moment();

        this.stateObj.csrfToken = tokens.create(csrfConfig.secret);

        if (_.isString(oldCsrfToken) && !_.isEmpty(oldCsrfToken)) {
            this.stateObj.oldCsrfToken = oldCsrfToken;
            this.stateObj.refreshTimestamp = refreshTimestamp;
        }

        return this.stateObj.csrfToken;
    }

    /**
     * Generates a unique key to represent this session based on the session ID.
     * @returns String
     */
    get key() {
        return Session.generateKey(this.idFromStateObj);
    }

    verifyCsrfToken(csrfToken) {
        // Old CSRF tokens are still valid for 5 mins.
        return (
            tokens.verify(csrfConfig.secret, csrfToken)
                || (this.stateObj.oldCsrfToken != null
                && this.stateObj.refreshTimestamp != null
                && this.stateObj.oldCsrfToken === csrfToken
                && moment().subtract(5, 'm').isSameOrBefore(this.stateObj.refreshTimestamp))
        );
    }

    get id() {
        return this.idFromStateObj;
    }

    static set id(id) {  // eslint-disable-line no-unused-vars
        throw e.throwServerError('Session ID is immutable.');
    }

    get csrfToken() {
        return this.stateObj.csrfToken;
    }

    set csrfToken(csrfToken) {  // eslint-disable-line no-unused-vars
        throw e.throwServerError('Unsupported! ' +
                                    'Please use the `session.generateCsrfToken()` method.');
    }

    get hasValidAccessToken() {
        // TODO Check if token is valid.
        return true;
    }

    get state() {
        return _.cloneDeep(this.stateObj);
    }

    static set state(state) {  // eslint-disable-line no-unused-vars
        throw e.throwServerError('Session state is immutable.');
    }

    /**
     * Merges the new state with the existing state.
     * @param newState
     */
    updateState(state) {
        _.merge(this.stateObj, state);
    }

    toString() {
        const snapshot = _.cloneDeep(this.stateObj);

        snapshot.id = this.idFromStateObj;

        if (_.has(snapshot, 'refreshTimestamp')) {
            snapshot.refreshTimestamp = snapshot.refreshTimestamp.valueOf();
        }

        return JSON.stringify(snapshot);
    }
}

export default Session;
