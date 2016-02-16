'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import chance from 'chance';
import { Router } from 'express';
import uuid from 'uuid';
import bodyParser from 'body-parser';
import validator from 'validator';
import moment from 'moment';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';

/**========================================
 * Generate random users
 ========================================**/
let generator = chance();
const MAX_USERS = 1000;
let _users = [];

for (let i = 0; i <= MAX_USERS; i++) {
    _users.push({
        id: i,
        name: generator.name(),
        gender: generator.gender(),
        birthday: generator.birthday(),
        address: {
            line1: generator.address(),
            line2: generator.city()
        }
    });
}

let api = Router();

api.use(bodyParser.json());

api.get('/users', (req, res) => {
    let perPageCount = (req.query.per_page_count == null || req.query.per_page_count < 1) ? 10 : parseInt(req.query.per_page_count),
        page = (req.query.page == null || req.query.page < 0) ? 1 : parseInt(req.query.page),
        startIndex = (page - 1) * perPageCount,
        endIndex = startIndex + perPageCount;

    let users = _.slice(_users, startIndex, endIndex);

    users = users.map(user => {
        /**
         * TODO: Odd numbered users will contain the whole object, while even numbered users will only contain ID and name.
         * TODO: Remove this if you're not trying to learn React.
         */
        if (user.id % 2 === 1) {
            return user;
        } else {
            return {id: user.id, name: user.name};
        }
    });

    let response = {
        page: page,
        totalCount: MAX_USERS,
        perPageCount: perPageCount,
        data: users
    };

    res.json(response);
});

// Mock a simple OAuth2.0 Bearer token check.
api.get('/user/:id', (req, res, next) => {
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');

        if (parts.length == 2) {
            const scheme = parts[0];
            const credentials = parts[1];

            // Fits the format we're looking for, so OK! NEXT!
            if (/^Bearer$/i.test(scheme)
                && validator.isUUID(credentials, '4')) {
                return next();
            }
        }
    }

    res.sendStatus(401); // Unauthorized.
}, (req, res) => {
    let id = req.params.id;

    if (id == null || _users.length <= id) {
        res.status(500).send({error: 'Invalid user'});
    } else {
        res.json(_users[id]);
    }
});

// We're emulating a oauth2 connect/authentication flow here
api.post(/^\/authentication\/(connect\/[a-z0-9]+(?:-[a-z0-9]+)?|register|reset-password)\/?$/i, (req, res, next) => {
    if (req.body.email && req.body.password) {
        let expiryDate = moment().add(1, 'hours');

        res.json({
            user: {
                email: req.body.email,
                password: req.body.password
            },
            tokens: {
                token: uuid.v4(),
                expiry: expiryDate,
                refreshToken: uuid.v4()
            }
        });
    } else {
        res.status(500).send({ error: 'Wrong email and password' })
    }

});

// We're emulating a oauth2 refresh flow here
api.post('/oauth2/token/refresh', (req, res) => {
    if (req.body.tokens && req.body.tokens.refreshToken && validator.isUUID(req.body.tokens.refreshToken, '4')) {
        res.json({
            token: uuid.v4(),
            expiry: moment().add(1, 'hours'),
            refreshToken: uuid.v4()
        });
    } else {
        res.status(400).send({error: 'Missing refresh token'});
    }
});

export default api;
