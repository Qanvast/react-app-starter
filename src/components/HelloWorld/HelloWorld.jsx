var React = require('react');

var AppActions = require('../../actions/AppActions');

var NameStore = require('../../stores/NameStore');

/**
 * Retrieve the current data from the EmailStore and NameStore
 */
function getCurrentState() {
    return {
        name: NameStore.getName()
    };
}

var HelloWorld = React.createClass({

    getInitialState: function () {
        return getCurrentState();
    },

    componentDidMount: function () {
        NameStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        NameStore.removeChangeListener(this._onChange);
    },

    /**
     * @return {object}
     */
    render: function () {
        return (
            <form onSubmit={AppActions.helloWorld(this.name)}>
                <h1>Say hello to.. {this.state.name}</h1>
                <p>Name:
                    <input type="text" name="name" />
                </p>
                <p>Email:
                    <input type="text" name="email" />
                </p>
                <button type="submit">Submit</button>
            </form>
        );
    },

    /**
     * Event handler for 'change' events coming from the TodoStore
     */
    _onChange: function () {
        this.setState(getCurrentState());
    }

});

module.exports = HelloWorld;
