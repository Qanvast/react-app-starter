'use strict';

// React
import React from 'react';

// Libraries
import assign from 'object-assign';
import {Link} from 'react-router';

// Actions
import AppActions from '../../../actions/AppActions';
import UserActions from '../../../actions/UserActions';

// Components
import {Button, ButtonGroup, Panel} from 'react-bootstrap';

// Stores
import UserStore from '../../../stores/UserStore';

function getStateFromStores(parameters) {
    let user = UserStore.get(parameters.user.id);

    return (user == null) ? null : {
        isLoadingMoreDetails: false,
        user: user
    };
}

function fireActions(state, callback) {
    let parameters = {
        id: state.user.id,
        fields: ['id', 'name', 'gender'],
        callback: callback
    };

    UserActions.getUser(parameters);
}

/**
 * User Widget shows a quick user summary.
 *
 * It does not support server side rendering
 * but you can use a parent object to pass
 * it the server state.
 */
class Widget extends React.Component {
    constructor(props, context) {
        super(props, context); // NOTE: IntelliJ lints this as invalid. Ignore warning.

        this.state = {
            isFirstLoad: true,
            isLoadingMoreDetails: false,
            user: props // We set props as user
        };

        /**
         * Event handler for 'change' events coming from the UserStore
         */
        this.onChange = () => {
            let parameters = {
                user: {
                    id: this.state.user.id
                }
            };

            let newState = getStateFromStores(parameters);

            if (newState != null) {
                this.setState(newState);
            }
        };

        /**
         * Event handler for 'button click' events coming from the button
         */
        this.onButtonClick = () => {
            this.setState(_.merge({}, this.state, {isLoadingMoreDetails: true, isFirstLoad: false}), () => {
                fireActions(this.state);
            }); // Set isLoadingMoreDetails to true
        };
    }

    componentDidMount() {
        UserStore.listen(this.onChange);
    }

    componentWillUnmount() {
        UserStore.unlisten(this.onChange);
    }

    /**
     * @return {object}
     */
    render() {
        let panelContent;

        if (this.state.isLoadingMoreDetails === true) {
            panelContent = (
                <p><span>Loading more details...</span></p>
            );
        } else {
            if (this.state.user.gender != null && this.state.isFirstLoad !== true) {
                panelContent = (
                    <p>
                        <span>{this.state.user.name} is {this.state.user.gender}!</span>
                    </p>

                );
            } else {
                panelContent = (
                    <p><Button bsStyle='success' bsSize='large' onClick={this.onButtonClick}>Show Gender!</Button></p>
                );
            }
        }

        const panelHeader = (<h3>{this.state.user.name} (ID : {this.state.user.id})</h3>);
        const panelFooter = (
            <Button bsStyle='info' onClick={() => {this.context.location.transitionTo('user-details', {id: this.state.user.id});}}>
                Full Details
            </Button>
        );

        return (
            <Panel key={this.state.user.id} header={panelHeader} footer={panelFooter}>{panelContent}</Panel>
        );
    }
}

Widget.contextTypes = {
    location: React.PropTypes.object.isRequired
};

Widget.propTypes = {
    id: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]).isRequired,
    name: React.PropTypes.string.isRequired
};

export default Widget;
