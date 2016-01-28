
/**========================================
 * Libraries
 ========================================**/
import cors from 'cors';

/**========================================
 * Utilities
 ========================================**/
import e from 'qanvast-error';

/**========================================
 * Configs
 ========================================**/
import corsConfig from '../configs/cors';

export default (env) => {
    if (env == null) {
        env = 'development';
    }

    let options = {
        credentials: true // Access-Control-Allow-Credentials: true
    };

    options.origin = (origin, callback) => {
        if (origin == null) {
            return callback(null, (env === 'development'));
        }

        let originIsWhitelisted = false;

        if (env === 'development') {
            // If we are in development env, we'll match localhost too.
            originIsWhitelisted = /^http[s]?:\/\/(?:[0-9a-zA-Z-]+\.)?localhost(?::\d+)*(?:\/.*)*$/i.test(origin);
        }

        // We'll allow any requests from *.qanvast.com in relaxed mode!
        // For strict mode, we'll only allow requests from URLs specified in config.
        if (originIsWhitelisted === false) {
            if (corsConfig.mode === 'relaxed') {
                originIsWhitelisted = /^http[s]?:\/\/(?:[0-9a-zA-Z-]+\.)?qanvast\.com(?:\/.*)*$/i.test(origin);
            } else {
                originIsWhitelisted = corsConfig.whitelist.indexOf(origin) !== -1;
            }
        }

        let error = null;

        if (originIsWhitelisted === false) {
            error = e.throwForbiddenError();
        }

        callback(error, originIsWhitelisted);
    };

    return cors(options);
};
