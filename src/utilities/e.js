'use strict';

/**========================================
 * Libraries
 ========================================**/
import _ from 'lodash';
import util from 'util';

function isError (error) {
    return (_.isObject(error) && typeof error.name == 'string' && typeof error.message == 'string');
}

function throwError (message, originalError) {
    let nestedError;

    if (arguments.length > 1 && _.isString(message)) {
        let lastArg = arguments[arguments.length - 1];

        if (isError(lastArg)) {
            message = util.format.apply(util, _.slice(arguments, 0, arguments.length - 1));
            nestedError = lastArg;
        } else {
            message = util.format.apply(util, _.slice(arguments));
        }
    } else {
        if (arguments.length === 1 && isError(message)) {
            nestedError = message;
        }

        if (!_.isString(message)) {
            message = this.defaultMessage ;
        }
    }

    let error = new Error(message);
    error.status = this.status;

    if (nestedError != null) {
        error.stack = nestedError.stack;
        error.internalMessage = nestedError.message;
    }

    return error;
}

export default {
    isError: isError,

    throwServerError: throwError.bind({
        status: 500,
        defaultMessage: 'Server Error'
    }),

    throwWtfError: throwError.bind({
        status: 500,
        defaultMessage: 'WTF, What a Terrible Failure!'
    }),

    throwBadRequestError: throwError.bind({
        status: 400,
        defaultMessage: 'Bad Request'
    }),

    throwNotFoundError: throwError.bind({
        status: 404,
        defaultMessage: 'Not Found'
    }),

    throwConflictError: throwError.bind({
        status: 409,
        defaultMessage: 'Conflict'
    }),

    throwUnauthorizedError: throwError.bind({
        status: 401,
        defaultMessage: 'Unauthorized'
    }),

    throwForbiddenError: throwError.bind({
        status: 403,
        defaultMessage: 'Forbidden'
    })
};
