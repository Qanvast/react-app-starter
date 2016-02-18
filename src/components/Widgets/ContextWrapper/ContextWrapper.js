import React from 'react';

/**
 * This component is necessary to get around a context warning
 * present in React 0.13.0. It sovles this by providing a separation
 * between the "owner" and "parent" contexts.
 */
class ContextWrapper extends React.Component {
    getChildContext() {
        return this.context;
    }
}

ContextWrapper.contextTypes = {
    router: React.PropTypes.object.isRequired
};

ContextWrapper.childContextTypes = {
    router: React.PropTypes.object.isRequired
};

export default ContextWrapper;
