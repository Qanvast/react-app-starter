// Libraries
import _ from 'lodash';
import qs from 'qs';

// import validator from 'validator';

// Base API class
import Base from './Base';

class User extends Base {
    static get(id) {
        const options = {
            method: 'GET'
        };

        const reqUrl = `${this.constants.BASE_URL}/user/${id}`;

        return () => {
            return this.generateRequest(reqUrl, options);
        }
    }

    static getPage(page, perPageCount) {
        const options = {
            method: 'GET'
        };

        let reqUrl = `${this.constants.BASE_URL}/users`;

        const queryString = qs.stringify({
            page,
            per_page_count: perPageCount
        });

        if (!_.isEmpty(queryString)) {
            reqUrl += `?${queryString}`;
        }

        return () => {
            return this.generateRequest(reqUrl, options)
                .then((response) => {
                    if (response.page === page &&
                        response.perPageCount === perPageCount &&
                        response.data != null) {
                        return Promise.resolve(response.data);
                    } else {
                        return reject(e.throwServerError('Corrupted response.'));
                    }
                });
        }
    }
}

export default User;
