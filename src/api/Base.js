// Libraries
import _ from 'lodash';
import cookie from 'cookie';
import { Promise } from 'es6-promise';

import e from 'qanvast-error';

const baseUrl = `${__SERVER__ ? process.env.API_BASE_URL : 'http://localhost:8000/proxy'}`;
const targetApiVersion = '4.1.0';
const defaultErrorMessage = 'Unsuccessful HTTP response.';

class API {
    constructor() {

    }

    static hasCsrfToken() {
        if (__SERVER__) return false;

        if (__CLIENT__) {
            const cookieObj = cookie.parse(document.cookie);

            return _.has(cookieObj, 'csrfToken');
        }
    }

    static getCsrfToken() {
        if (__SERVER__) return undefined;

        if (__CLIENT__) {
            const cookieObj = cookie.parse(document.cookie);

            return cookieObj.csrfToken;
        }
    }

    static generateRequest(url, options) {
        let thisOptions;

        if (_.isPlainObject(options)) {
            thisOptions = _.cloneDeep(options);
        } else {
            thisOptions = {};
        }

        _.defaults(thisOptions, this.constants.DEFAULT_OPTIONS);


        return new Promise(
            (resolve, reject) => {
                fetch(url, thisOptions)
                    .then(resp => {
                        if (resp.status >= 200 && resp.status < 300) {
                            return resp.json();
                        }

                        reject(e.throwServerError(resp.statusText || defaultErrorMessage));

                        return false;
                    })
                    .then(data => {
                        if (data !== false) {
                            resolve(data);
                        }
                    })
                    .catch(error => {
                        reject(e.throwServerError('Corrupted response.', error));
                    });
            }
        );
    }
}

API.constants = {
    BASE_URL: baseUrl,
    TIMEOUT_MS: 500,
    DEFAULT_OPTIONS: {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Credentials: 'include',
            'X-Qanvast-API-Version': targetApiVersion
        }
    },
    DEFAULT_ERROR_MESSAGE: defaultErrorMessage
};

if (__SERVER__) {
    // TODO Server side rendering will render without auth state.
    API.constants.DEFAULT_OPTIONS.headers['X-Qanvast-Client-Secret'] = process.env.CLIENT_SECRET;
}

export default API;
