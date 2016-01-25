// Core
import alt from '../alt';
// import EventEmitter from 'eventemitter3';

// Actions
import AppActions from '../actions/AppActions';

// Libraries
import _ from 'lodash';
// import assign from 'object-assign';

class AppStore {
    constructor() {
        this.alerts = [];

        this.bindAction(AppActions.showAlert, this.onAddPendingAlert);

        this.exportPublicMethods({
            addPendingAlert: this.addPendingAlert,
            getPendingAlerts: this.getPendingAlerts
        });
    }

    onAddPendingAlert(data) {
        if (data.error != null) {
            this.addPendingAlert({
                type: 'error',
                title: 'Oops!',
                message: _.has(data, 'error.response.body.message') ? data.error.response.body.message : data.error.message,
                error: _.has(data, 'error.response.body') ? data.error.response.body : undefined
            });
        }
    }

    addPendingAlert(alert) {
        if (_.isObject(alert)
            && (alert.type == null || /^((?:info)|(?:success)|(?:error)|(?:warning))$/i.test(alert.type))
            && alert.message != null && alert.title != null) {
            const clonedAlert = _.cloneDeep(alert);

            if (clonedAlert.type == null) {
                clonedAlert.type = 'info';
            }

            this.alerts.push(clonedAlert);

            return true;
        }

        return false;
    }

    getPendingAlerts() {
        const state = this.getState();

        return state.alerts.splice(0, state.alerts.length);
    }
}

export default alt.createStore(AppStore, 'AppStore', false);
