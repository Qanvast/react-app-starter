// Libraries
import _ from 'lodash';
import fetch from 'isomorphic-fetch';
// import validator from 'validator';

import e from 'qanvast-error';

// Base API class
import Base from './Base';

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];

class Proxy extends Base {
    static forward(req) {
        if (__SERVER__) {
            const options = {
                method: req.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            if (req.session != null && req.session.hasValidAccessToken) {
                options.headers.Authorization = `Bearer ${req.session.accessToken}`;
            }

            // We just pass on the body
            if (_.indexOf(methodsWithBody, req.method.toUpperCase()) >= 0) {
                options.body = JSON.stringify(req.body);
            }

            return new Promise((resolve, reject) => {
                const reqPath = req.originalUrl.split('/').splice(2).join('/');
                const reqUrl = `${this.constants.BASE_URL}/${reqPath}`;

                fetch(reqUrl, options)
                    .then(response => {
                        if (response.status >= 200 && response.status < 300) {
                            return response.json();
                        }

                        reject(e.throwServerError(response.statusText || 'Unsuccessful HTTP response.'));

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
            });
        }

        if (__CLIENT__) {
            return Promise.reject(e.throwServerError());
        }
    }

    static refreshToken(req) {
        if (__SERVER__) {
            const body = {};

            if (req.session == null || !req.session.hasRefreshToken) {
                return Promise.reject(e.throwForbiddenError());
            } else {
                body.refreshToken = req.session.refreshToken;
                // TODO Add user ID
            }

            const options = {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            return new Promise((resolve, reject) => {
                fetch(this.constants.BASE_URL + '/oauth2/token/refresh', options)
                    .then(response => {
                        if (response.status >= 200 && response.status < 300) {
                            return response.json();
                        } else {
                            reject(e.throwServerError(response.statusText || 'Unsuccessful HTTP response.'));

                            return false;
                        }
                    })
                    .then(data => {
                        if (data !== false) {
                            if (_.has(data, 'tokens.token')
                                && _.has(data, 'tokens.expiry')
                                && _.has(data, 'tokens.refreshToken')) {
                                resolve(data.tokens);
                            } else {
                                reject(e.throwServerError('Corrupted response.'));
                            }
                        }
                    })
                    .catch(function(error) {
                        reject(e.throwServerError('Corrupted response.', error));
                    });
            });
        }

        if (__CLIENT__) {
            return Promise.reject(e.throwServerError());
        }
    }
}

export default Proxy;
