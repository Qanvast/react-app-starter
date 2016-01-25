import _ from 'lodash';

export default (obj, key) => {
    if (_.isString(key)) {
        return (obj[key] != null);
    } else if (_.isArray(key)) {
        let subObj = obj;
        let hasAllRequiredKeys = true;

        for (const subKey of key) {
            subObj = subObj[subKey];

            if (subObj == null) {
                hasAllRequiredKeys = false;
                break;
            }
        }

        return hasAllRequiredKeys;
    }

    return false;
};
