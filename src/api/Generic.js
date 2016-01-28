'use strict';

// Libraries
import _ from 'lodash';
import fetch from 'isomorphic-fetch';

const hasBodyMethods = ['POST', 'PUT', 'PATCH'];
const API_BASE_URL = 'http://localhost:8000/api';

export default {

    sendRequestToApi: function(req, callback) {

        let reqUrl = '/' + req.originalUrl.split('/').splice(2).join('/'); // to get the url path + query parameters (e.g. /users?page=1&per_page_count=5

        let options = {
            method: req.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        if (_.indexOf(hasBodyMethods, req.method.toUpperCase()) > -1) {
            options.body = JSON.stringify(req.body);
        }

        fetch(API_BASE_URL+reqUrl, options)
            .then(response => {
                if (response.status >= 200 && response.status < 300) {
                    return response
                } else {
                    var error = new Error(response.statusText)
                    error.response = response
                    throw error
                }
            })
            .then(response => response.json())
            .then(function(data) {
                callback(null, data);
            })
            .catch(function(error) {
                callback(error, null);
            });

    },

    sendRefreshTokenRequest: function(tokens, callback) {
        let options = {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                tokens: tokens
            }),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };

        fetch(API_BASE_URL + '/oauth2/token/refresh', options)
            .then(response => {
                if (response.status >= 200 && response.status < 300) {
                    return response
                } else {
                    var error = new Error(response.statusText)
                    error.response = response
                    throw error
                }
            })
            .then(response => response.json())
            .then(function(data) {
                callback(null, data);
            })
            .catch(function(error) {
                callback(error, null);
            });
    }

};

