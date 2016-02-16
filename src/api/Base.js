// Libraries
import _ from 'lodash';
import cookie from 'cookie';
import prefix from 'superagent-prefix';

const BASE_URL = `${__SERVER__ ? 'http://localhost:8000/api': 'http://localhost:8000/proxy'}`;

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
        if (__SERVER__) return null;

        if (__CLIENT__) {
            const cookieObj = cookie.parse(document.cookie);

            return cookieObj.csrfToken;
        }
    }
}

API.constants = {
    BASE_URL: BASE_URL,
    URL_PREFIX: prefix(BASE_URL),
    TIMEOUT_MS: 500
};

export default API;
