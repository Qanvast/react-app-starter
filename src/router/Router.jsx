'use strict';

/*=================================
 Libraries
 =================================*/
import _ from 'lodash';
import alt from '../alt';
import async from 'async';
import Iso from 'iso';

/*=================================
 Configs
 =================================*/
import appConfig from '../configs/app';

/*=================================
 React & Router
 =================================*/
import React from 'react';
import Router from 'react-router';

/*=================================
 Google Analytics
 =================================*/
import GoogleAnalytics from 'react-ga';

/*=================================
 Routes
 =================================*/
import routes from './Routes.jsx';

/*=================================
 Router
 =================================*/

function getDataForRoutes (state, callback) {
    async.waterfall([
        callback => {
            // Loop through the matching routes
            let routesWithData = state.routes.filter((route) => { return route.handler.fetchData; });
            let routesWithMetadata = state.routes.filter((route) => { return route.handler.generateMetadata; });
            let routeWithMetadata = null;

            // We always take the last one route with meta data.
            if (routesWithMetadata.length >= 1) {
                routeWithMetadata = routesWithMetadata[routesWithMetadata.length - 1];
            }

            callback(null, routesWithData, routeWithMetadata);
        },

        (routesWithData, routeWithMetadata, callback) => {
            async.map(routesWithData, (route, fetchDataCallback) => {
                // Fetch data for each route
                route.handler.fetchData(state, fetchDataCallback);
            }, error => {
                callback(error, routeWithMetadata);
            });
        },

        (routeWithMetadata, callback) => {
            let metadata = _.cloneDeep(appConfig.metadata);

            if (routeWithMetadata != null) {
                _.merge(metadata, routeWithMetadata.handler.generateMetadata(state));
            }

            callback(null, metadata);
        }
    ], callback);
}

export default class AppRouter {
    /**
     * Client side router initialization.
     * @param data
     */
    static init() {
        Router.run(routes, Router.HistoryLocation, (Handler, state) => {
            GoogleAnalytics.pageview(state.pathname);

            let callback = (error, metadata) => {
                if (!error && metadata != null && metadata.title != null) {
                    document.title = metadata.title;
                }

                React.render(<Handler/>, document.getElementById('app'));
            };

            getDataForRoutes(state, callback);
        });
    }

    /**
     * Server side rendering - Data retrieval
     */
    static getData(req, res, next) {
        Router.run(routes, req.url, (Handler, state) => {
            res.local = {
                Handler,
                state
            };

            let callback = (error, metadata) => {
                if (!error) {
                    res.local.metadata = metadata;
                    next();
                } else {
                    next(error);
                }
            };

            getDataForRoutes(state, callback);
        });
    }

    /**
     * Server side rendering - Website serving
     */
    static serve(req, res, next) {
        let iso = new Iso();
        let Handler = res.local.Handler;
        let metadata = res.local.metadata;

        let htmlBody = React.renderToString(<Handler/>);

        let data = alt.flush(); // Take a snapshot of the datastores and flush it

        iso.add(htmlBody, data); // Add the data snapshot to the response

        res.render('index', {
            app: appConfig,
            body: iso.render(),
            metadata
        });
    }
}
