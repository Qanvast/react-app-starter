'use strict';

/**========================================
 * Packages
 ========================================**/
import _ from 'lodash';
import chance from 'chance';
import {Router} from 'express';

/**========================================
 * Utilities
 ========================================**/
import e from '../utilities/e';

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

api.get('/users', (req, res) => {
    console.log('origin is ', req.get('origin'));
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

api.get('/user/:id', (req, res) => {
    let id = req.params.id;

    if (id == null || _users.length <= id) {
        res.status(500).send({error: 'Invalid user'});
    } else {
        res.json(_users[id]);
    }
});

api.post(/^\/authentication\/(connect\/[a-z0-9]+(?:-[a-z0-9]+)?|register|reset-password)\/?$/i, (req, res, next) => {
    if (req.body.email && req.body.password) {
        res.json({
            accessToken: 'ASDkjnJKSnkjslflkjbjBKBASJBDLS@#!123123',
            email: req.body.email,
            password: req.body.password
        });
    } else {
        res.status(500).send({error: 'Wrong email and password'})
    }

});


export default api;
