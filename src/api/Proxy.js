// Libraries
import _ from 'lodash';
// import validator from 'validator';

import e from 'qanvast-error';

// Base API class
import Base from './Base';

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE'];

class Proxy extends Base {
    static forward(req) {
        if (__SERVER__) {
            const reqPath = req.originalUrl.split('/').splice(2).join('/');
            const reqUrl = `${this.constants.BASE_URL}/${reqPath}`;

            const options = {
                method: req.method
            };

            if (req.session != null && req.session.hasValidAccessToken) {
                options.headers.Authorization = `Bearer ${req.session.accessToken}`;
            }

            // We just pass on the body
            if (_.indexOf(methodsWithBody, req.method.toUpperCase()) >= 0) {
                options.body = JSON.stringify(req.body);
            }

            return this.generateRequest(reqUrl, options);
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
            }

            body.refreshToken = req.session.refreshToken;
            // Include userId to request body, as backend API needed this info
            body.userId = req.session.userId;

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
                    .then(resp => {
                        if (resp.status >= 200 && resp.status < 300) {
                            return resp.json();
                        }

                        reject(e.throwServerError(resp.statusText || this.constants.DEFAULT_ERROR_MESSAGE));

                        return false;
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
                    .catch(error => {
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
