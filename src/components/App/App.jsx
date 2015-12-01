'use strict';

// React
import React from 'react';

// Libraries
import _ from 'lodash';

// Components
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import GoogleAnalytics from 'react-ga';
import List from '../Widgets/List';

// Stores
import AppStore from '../../stores/AppStore';

class App extends React.Component {
    constructor(props, context) {
        super(props, context); // NOTE: IntelliJ lints this as invalid. Ignore warning.
    }

    componentDidMount() {
        AppStore.listen(this.onAlert);
    }

    componentWillUnmount() {
        AppStore.unlisten(this.onAlert);
    }

    /**
     * @return {object}
     */
    render() {
        return (
            <div>
                <Navbar brand='React App Starter' staticTop toggleNavKey={0}>
                    <Nav right eventKey={0}> {/* This is the eventKey referenced */}
                      <NavItem eventKey={1} href='http://stevetan.me'>Blog</NavItem>
                    </Nav>
                </Navbar>
                <main className='container-fluid'>
                    {this.props.children}
                </main>
                <footer className='container-fluid'>
                    <div className='row'>
                        <hr />
                        <section>
                            <span>Footer Section 1</span>
                        </section>

                        <section>
                            <span>Footer Section 2</span>
                        </section>

                        <section>
                            <span>Footer Section 3</span>
                        </section>
                    </div>
                </footer>
            </div>
        );
    }

    /**
     * Event handler for 'change' events coming from the UserStore
     */
    onAlert() {
        _.forEach(AppStore.getPendingAlerts(), (alertPayload) => {
            console.log(`${alertPayload.type.toUpperCase()} :: ${alertPayload.title} - ${alertPayload.message}`);
            window.alert(`${alertPayload.type.toUpperCase()} :: ${alertPayload.title} - ${alertPayload.message}`);
        });
    }
}

export default App;
