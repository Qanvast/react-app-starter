'use strict';

// Libraries
import prefix from 'superagent-prefix';

class API {
    constructor () {

    }
}

API.constants = {
    BASE_URL: prefix('http://localhost:8000/api'),
    TIMEOUT_MS: 500
};

export default API;
