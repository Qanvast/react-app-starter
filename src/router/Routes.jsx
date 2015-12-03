'use strict';

/*=================================
 React & Router
 =================================*/
import React from 'react';
import {Route, IndexRoute} from 'react-router';

/*=================================
 Components
 =================================*/
import App from '../components/App';
import Home from '../components/Home';
import UserDetails from '../components/User/Details';

/*=================================
 ROUTES
 =================================*/
let routes = (
    <Route path="/" component={App} >
        <Route path="/user/:id" component={UserDetails} />
        <Route path="/:page" component={Home} />
        <IndexRoute component={Home} />
    </Route>
);

export default routes;
