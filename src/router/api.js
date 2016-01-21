'use strict';

import {Router} from 'express';

let api = Router();

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

api.get('/user/:id', (req, res) => {
    let id = req.params.id;

    if (id == null || _users.length <= id) {
        res.status(500).send({error: 'Invalid user'});
    } else {
        res.json(_users[id]);
    }
});

export default api;
