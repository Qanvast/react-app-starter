// Libraries
import _ from 'lodash';
import async from 'async';
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
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            // We just pass on the body
            if (_.indexOf(methodsWithBody, req.method.toUpperCase()) >= 0) {
                options.body = JSON.stringify(req.body);
            }

            return new Promise((resolve, reject) => {
                fetch(`${this.constants.BASE_URL}/${req.originalUrl.split('/').splice(2).join('/')}`, options)
                    .then(response => {
                        if (response.status >= 200 && response.status < 300) {
                            let parsedResponse = response.json();

                            resolve(parsedResponse.data);
                        } else {
                            reject(e.throwServerError(response.statusText || 'Unsuccessful HTTP response.'));
                        }
                    })
                    .catch(error => {
                        reject(e.throwServerError('Corrupted response.', error));
                    })
            });
        }

        if (__CLIENT__) {
            return Promise.reject(e.throwServerError());
        }
    }

    static refreshToken(refreshToken, userId) {
        if (__SERVER__) {
            let options = {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({
                    refreshToken: refreshToken,
                    userId: userId
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            return new Promise((resolve, reject) => {
                fetch(this.constants.BASE_URL + '/oauth2/token/refresh', options)
                    .then(response => {
                        if (response.status >= 200 && response.status < 300) {
                            let parsedResponse = response.json();

                            if (_.has(parsedResponse.data, 'tokens.token')
                                && _.has(parsedResponse.data, 'tokens.expiry')
                                && _.has(parsedResponse.data, 'tokens.refreshToken')) {
                                resolve(parsedResponse.data.tokens);
                            } else {
                                reject(e.throwServerError('Corrupted response.'));
                            }
                        } else {
                            reject(e.throwServerError(response.statusText || 'Unsuccessful HTTP response.', error));
                        }
                    })
                    .catch(function(error) {
                        reject(error);
                    });
            });
        }

        if (__CLIENT__) {
            return Promise.reject(e.throwServerError());
        }
    }
}

export default Proxy;
