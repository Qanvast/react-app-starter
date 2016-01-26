// Libraries
import _ from 'lodash';
import fetch from 'isomorphic-fetch';

const hasBodyMethods = ['POST', 'PUT', 'PATCH'];
const API_BASE_URL = 'http://localhost:8000/api';

export default {

    sendRequestToApi: function(req, callback) {

        let reqUrl = '/' + req.originalUrl.split('/').splice(2).join('/'); //req.params[0];
        let reqBody = req.body ? req.body : {};
        let options = {
            method: req.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        };
        if (_.indexOf(hasBodyMethods, req.method.toUpperCase()) > -1) {
            options.body = JSON.stringify(reqBody);
        };
        fetch(API_BASE_URL+reqUrl, options)
            .then(this.checkResponseStatus)
            .then(response => response.json())
            .then(function(data) {
                callback(null, data);
            })
            .catch(function(error) {
                callback(error, null);
            });

    },

    checkResponseStatus: function(response){
        if (response.status >= 200 && response.status < 300) {
            return response
        } else {
            var error = new Error(response.statusText)
            error.response = response
            throw error
        }
    }
};

