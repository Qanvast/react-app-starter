// Libraries
import _ from 'lodash';
import qs from 'qs';
import e from 'qanvast-error';

// import validator from 'validator';

// Base API class
import Base from './Base';

class User extends Base {
    static get(id) {
        const options = {
            method: 'GET'
        };

        if (__CLIENT__) {
            options.headers = {
                'X-CSRF-Token': this.getCsrfToken()
            };
        }

        const reqUrl = `${this.constants.BASE_URL}/user/${id}`;

        return () => this.generateRequest(reqUrl, options);
    }

    static getPage(page, perPageCount) {
        const options = {
            method: 'GET'
        };

        if (__CLIENT__) {
            options.headers = {
                'X-CSRF-Token': this.getCsrfToken()
            };
        }

        let reqUrl = `${this.constants.BASE_URL}/users`;

        const queryString = qs.stringify({
            page,
            per_page_count: perPageCount
        });

        if (!_.isEmpty(queryString)) {
            reqUrl += `?${queryString}`;
        }

        return () =>
            this
                .generateRequest(reqUrl, options)
                .then((response) => {
                    if (response.page === page &&
                        response.perPageCount === perPageCount &&
                        response.data != null) {
                        return Promise.resolve(response.data);
                    }

                    return Promise.reject(e.throwServerError('Corrupted response.'));
                });
    }
}

export default User;
