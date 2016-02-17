// Libraries
import async from 'async';
import http from 'superagent';
// import validator from 'validator';

// Base API class
import Base from './Base';

class User extends Base {

    static login(email, password) {
        return () => {
            const headers = {};
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            headers['x-csrf-token'] = this.getCsrfToken();

            return new Promise((resolve, reject) => {
                async.waterfall([
                    callback => {

                        http
                            .post('/authentication/connect/local/')
                            .use(this.constants.URL_PREFIX)
                            .set(headers)
                            .type('json')
                            .send({ email: email, password: password })
                            .withCredentials()
                            .timeout(this.constants.TIMEOUT_MS)
                            .end(callback);
                    },

                    (result, callback) => {
                        callback(null, result.body);
                    }
                ], (error, data) => {
                    if (!error) {
                        resolve(data);
                    } else {
                        reject(error);
                    }
                });
            });
        }
    }

    static get(id) {
        return () => {
            const headers = {};

            headers['x-csrf-token'] = this.getCsrfToken();

            return new Promise((resolve, reject) => {
                async.waterfall([
                    callback => {
                        http
                            .get('/user/' + id)
                            .set(headers)
                            .withCredentials()
                            .use(this.constants.URL_PREFIX)
                            .timeout(this.constants.TIMEOUT_MS)
                            .end(callback);
                    },

                    (result, callback) => {
                        // TODO: Transform the data if necessary.
                        // TODO: Otherwise, pass it back to the caller.
                        callback(null, result.body);
                    }
                ], (error, data) => {
                    if (!error) {
                        resolve(data);
                    } else {
                        reject(error);
                    }
                });
            });
        };
    }

    static getPage(page, perPageCount) {
        return () => {
            const headers = {};

            headers['x-csrf-token'] = this.getCsrfToken();

            return new Promise((resolve, reject) => {
                async.waterfall([
                    callback => {
                        http
                            .get('/users')
                            .set(headers)
                            .withCredentials()
                            .query({
                                page,
                                per_page_count: perPageCount
                            })
                            .use(this.constants.URL_PREFIX)
                            .timeout(this.constants.TIMEOUT_MS)
                            .end(callback);
                    },

                    (result, callback) => {
                        // TODO: Transform the data if necessary.
                        // TODO: Otherwise, pass it back to the caller.
                        const response = result.body;

                        if (response.page === page &&
                            response.perPageCount === perPageCount &&
                            response.data != null) {
                            callback(null, response.data);
                        } else {
                            callback(new Error('Invalid response!'));
                        }
                    }
                ], (error, data) => {
                    if (!error) {
                        resolve(data);
                    } else {
                        reject(error);
                    }
                });
            });
        };
    }
}

export default User;
