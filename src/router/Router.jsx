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
import {render} from 'react-dom';
import {renderToString} from 'react-dom/server';
import {Router, match, RoutingContext} from 'react-router';
import {createHistory} from 'history';

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

function getDataForRoutes (renderProps, callback) {
    async.waterfall([
        callback => {
            // Loop through the matching routes
            let routesWithData = renderProps.components.filter((component) => { return component.fetchData; });
            let routesWithMetadata = renderProps.components.filter((component) => { return component.generateMetadata; });
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
                route.fetchData(renderProps, fetchDataCallback);
            }, error => {
                callback(error, routeWithMetadata);
            });
        },

        (routeWithMetadata, callback) => {
            let metadata = _.cloneDeep(appConfig.metadata);

            if (routeWithMetadata != null) {
                _.merge(metadata, routeWithMetadata.generateMetadata(renderProps));
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
        render(
            <Router
                history={createHistory()}
                routes={routes}
                onUpdate={
                    function onUpdate () {
                        let state = this.state;

                        getDataForRoutes(state, (error, metadata) => {
                            if (!error) {
                                if (_.has(state, 'location.pathname')) {
                                    GoogleAnalytics.pageview(state.location.pathname);
                                }

                                if (_.has(metadata, 'title')) {
                                    document.title = metadata.title;
                                }
                            }
                        });
                    }
                }
            />,
            window.document.getElementById("app")
        );
    }

    /**
     * Server side rendering - Website serving
     */
    static serve(req, res, next) {
        match({routes, location: req.url}, (error, redirectLocation, renderProps) => {
            if (error) {
                next(error);
            } else if (redirectLocation) {
                res.redirect(302, redirectLocation.pathname + redirectLocation.search);
            } else if (renderProps) {
                getDataForRoutes(renderProps, (error, metadata) => {
                    if (!error) {
                        let iso = new Iso();
                        let htmlBody = renderToString(<RoutingContext {...renderProps} />);
                        let data = alt.flush(); // Take a snapshot of the datastores and flush it

                        iso.add(htmlBody, data); // Add the data snapshot to the response

                        res.render('index', {
                            app: appConfig,
                            body: iso.render(),
                            metadata
                        });
                    } else {
                        next(error);
                    }
                });
            } else {
                // TODO: Test
                next(); // Pass it on to server for 404 handling
            }
        });
    }
}
