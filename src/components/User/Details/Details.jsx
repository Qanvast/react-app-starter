'use strict';

// React
import React from 'react';

// Libraries
import _ from 'lodash';
import assign from 'object-assign';
import {Link} from 'react-router';

// Actions
import AppActions from '../../../actions/AppActions';
import UserActions from '../../../actions/UserActions';

// Components
import {Button, ButtonGroup, Panel} from 'react-bootstrap';

// Stores
import UserStore from '../../../stores/UserStore';

function getInitialState() {
    return {
        isLoading: true,
        user: {}
    };
}

function getStateFromStores(parameters) {
    let user = UserStore.get(parameters.user.id);

    return (user == null) ? null : {
        isLoading: false,
        user: user
    };
}

function fireActions(state, callback) {
    let parameters = {
        id: state.user.id,
        fields: ['id', 'name', 'gender', 'birthday', ['address', 'line1'], ['address', 'line2']],
        callback: callback
    };

    UserActions.getUser(parameters);
}

/**
 * User Details shows a user full details.
 */
class Details extends React.Component {
    constructor(props, context) {
        super(props, context); // NOTE: IntelliJ lints this as invalid. Ignore warning.

        this.state = getInitialState();

        /**
         * Event handler for 'change' events coming from the UserStore
         */
        this.onChange = () => {
            let parameters = {
                user: {
                    id: null
                }
            };

            if (this.context.router != null) {
                let params = this.context.router.getCurrentParams();

                if (params.id != null) {
                    let userId = parseInt(params.id);

                    if (!isNaN(userId)) {
                        parameters.user.id = userId;
                    }
                }
            }

            let newState = getStateFromStores(parameters);

            if (newState != null) {
                this.setState(newState);
            }
        };
    }

    componentDidMount() {
        UserStore.listen(this.onChange);
    }

    componentWillMount() {
        this.onChange();
    }

    componentWillUnmount() {
        UserStore.unlisten(this.onChange);
    }

    componentWillReceiveProps(nextProps) {
        this.onChange();
    }

    /**
     * @return {object}
     */
    render() {
        const panelHeader = (<h3>{this.state.user.name} (ID : {this.state.user.id})</h3>);
        const panelFooter = (
            <ButtonGroup>
                <Button bsStyle='info' onClick={() => {this.context.router.transitionTo('user-details', {id: parseInt(this.state.user.id) + 1});}}>
                    Next User
                </Button>
                <Button bsStyle='warning' onClick={() => { if (!this.context.router.goBack()) {this.context.router.transitionTo('app');}}}>
                    Back
                </Button>
            </ButtonGroup>
        );

        let panelContent;

        if (this.state.isLoading === true) {
            panelContent = (
                <p><span>Loading user details...</span></p>
            );
        } else {
            panelContent = (
                <p>
                    <span>{this.state.user.name} is {this.state.user.gender} and born on {this.state.user.birthday}!</span>
                    <br />
                    <span>{this.state.user.address.line1}</span>
                    <br />
                    <span>{this.state.user.address.line2}</span>
                </p>
            );
        }

        return (
            <Panel header={panelHeader} footer={panelFooter}>{panelContent}</Panel>
        );
    }

    /**
     * Static method to trigger data actions for server-side rendering.
     *
     * @param routerState
     * @returns {*}
     */
    static fetchData(routerState, callback) {
        let state = getInitialState();

        if (routerState.params != null) {
            if (routerState.params.id != null) {
                let userId = parseInt(routerState.params.id);

                if (!isNaN(userId)) {
                    state.user.id = userId;
                }
            }
        }

        fireActions(state, callback);
    }

    static generateMetadata(routerState) {
        let state = getInitialState();

        if (routerState.params != null) {
            if (routerState.params.id != null) {
                let userId = parseInt(routerState.params.id);

                if (!isNaN(userId)) {
                    state.user.id = userId;
                }
            }
        }

        let user = UserStore.get(state.user.id);

        return {
            title: `User Details - ${user.name}`,
            description: `${user.name} is ${user.gender} and born on ${user.birthday}!`
        };
    }
}

Details.contextTypes = {
    router: React.PropTypes.func.isRequired
};

export default Details;
