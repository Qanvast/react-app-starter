// Libraries
import _ from 'lodash';

// Dispatcher and constants
import alt from '../alt';

// Actions
import AppActions from './AppActions';

// API
import UserAPI from '../api/User';

class UserActions {
    getUser(parameters) {
        const { id, fields, callback } = parameters;

        const payload = {
            id,
            fields,
            getData: UserAPI.get(id),
            onError: error => {
                AppActions.showAlert({ error });
            },
            onFinish: (callback != null && _.isFunction(callback)) ? callback : undefined
        };

        this.dispatch(payload);
    }

    getUsers(parameters) {
        const { page, perPageCount, fields, callback } = parameters;

        const payload = {
            page,
            perPageCount,
            fields,
            getData: UserAPI.getPage(page, perPageCount),
            onError: error => {
                // TODO: You can add in hooks here to do something when an error occurs.
                AppActions.showAlert({ error });
            },
            onFinish: (callback != null && _.isFunction(callback)) ? callback : undefined
        };

        this.dispatch(payload);
    }

    loginUser(parameters) {
        const { email, password, callback } = parameters;

        const payload = {
            email,
            password,
            getData: UserAPI.login(email, password),
            onError: error => {
                // TODO: You can add in hooks here to do something when an error occurs.
                AppActions.showAlert({ error });
            },
            onFinish: (callback != null && _.isFunction(callback)) ? callback : undefined
        };

        this.dispatch(payload);
    }
}

export default alt.createActions(UserActions);
