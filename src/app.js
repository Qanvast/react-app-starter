'use strict';

import Router from './router';

/*=================================
 Bootstrapping Libraries
 =================================*/
import alt from './alt';
import Iso from 'iso';

/*=================================
 Configs
 =================================*/
import appConfig from './configs/app';

/*=================================
 Google Analytics
 =================================*/
import GoogleAnalytics from 'react-ga';

if (typeof window !== 'undefined') {
    window.onload = function () {
        GoogleAnalytics.initialize(appConfig.googleAnalytics.appId);

        Iso.bootstrap((state, meta, node) => {
            alt.bootstrap(state);

            Router.init();
        });
    };
}
