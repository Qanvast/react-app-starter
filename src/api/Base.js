// Libraries
import prefix from 'superagent-prefix';

class API {
    constructor() {

    }
}

API.constants = {
    BASE_URL: __SERVER__ ? prefix('http://localhost:8000/api') : prefix('http://localhost:8000/proxy'),
    TIMEOUT_MS: 500
};

export default API;
