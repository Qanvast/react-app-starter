// Libraries
import prefix from 'superagent-prefix';

const BASE_URL = `${__SERVER__ ? 'http://localhost:8000/api': 'http://localhost:8000/proxy'}`;

class API {
    constructor() {

    }
}

API.constants = {
    BASE_URL: BASE_URL,
    URL_PREFIX: prefix(BASE_URL),
    TIMEOUT_MS: 500
};

export default API;
