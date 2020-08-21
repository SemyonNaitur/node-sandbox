'use strict'

/**
 * @callback RouteMatchCallback
 * @param {string} urlPath
 * @return {Object | Boolean} Return params or true on success.
 */

/**
 * @callback RouteMatchedCallback
 * @param {Object} serverRequest
 * @param {Object} serverResponse
 * @param {Object} params
 * @return {void}
 */

/**
 * string format: <segment>/<:param>/.../<rest params (...)>, e.g., 'category/:id/...'
 * @typedef {string | RegExp | RouteMatchCallback} TRoutePath
 */

/**
 * A route with path='not-found' will override defualt 404.
 * 
 * @typedef {Object} IRoute - Route interface
 * @prop {string} [name]
 * @prop {TRoutePath} [path] - Required if regex is not provided.
 * @prop {string | RegExp} [regex] - If both path and regex are provided, path would be ignored.
 * @prop {RouteMatchedCallback} func 
 */

/**
 * @typedef {Object} IMatch - Matched route data
 * @prop {IRoute} route
 * @prop {Object} params - If a query string is present, params would contain a 'queryParams' sub-object.
 */

class URouter {
    /** @type {Object} */
    _logger;
    /** @type {IRoute[]} */
    _routes;
    /** @type {IRoute} */
    _notFoundRoute;

    /**
     * @param {{routes: IRoute[]}} routes
     * @param {Object} [logger]
     */
    constructor(config, logger = null) {
        const routes = config?.routes;
        if (!Array.isArray(routes) || routes.length < 1) {
            throw new Error(`Invalid routes array: ${routes}`);
        }
        this._logger = logger;
        this._initRoutes(routes);
    }

    _initRoutes(routes) {
        let i = 0;
        this._routes = routes.map(route => {
            if (!route || (typeof route !== 'object')) {
                throw new TypeError(`Invalid route object at index ${i}: ${route}`);
            }
            if (typeof route.func !== 'function') {
                throw new TypeError(`Invalid route function at index ${i}: ${route.func}`);
            }

            let regex;

            if (route.regex) {
                regex = this._parseRegex(route.regex);
            } else {
                if (!('path' in route)) {
                    throw new Error(`Missing route path at index ${i}`);
                }
                regex = this._parsePath(route.path);
                if (regex === false) {
                    throw new TypeError(`Invalid route path at index ${i}: ${route.path}`);
                }
            }

            if ((typeof route.path === 'string') && (this._trim(route.path, '/') === 'not-found')) {
                this._notFoundRoute = route;
            }
            i++;
            return this._objMerge(route, { regex });
        });
    }

    _parseRegex(regex) {
        if (!(regex instanceof RegExp)) {
            if (typeof regex !== 'string') {
                throw new TypeError(`Invalid regex pattern: ${regex}`);
            }
            regex = new RegExp(regex);
        }
        return regex;
    }

    _parsePath(path) {
        if (typeof path === 'function') return;
        if (path instanceof RegExp) return path;
        if (typeof path === 'string') return this._parsePathString(path);
        return false;
    }

    /**
     * Transforms the path string to a regex by replacing each named url segment
     * with a corresponding named capturing group - e.g., :id -> (?<id>[^/]+)
     * A trailing '/...' notation is transformed to '_restString' group.
     * 
     * Leading/trailing '/'s are removed.
     */
    _parsePathString(path) {
        let patt = this._trim(path, '/');
        patt = patt.replace(/:([^/]+)/g, '(?<$1>[^/]+)'); // parse params
        patt = patt.replace(/\.{3}$/, '(?<_restString>.+)?'); // parse rest string
        this._log(patt);
        return new RegExp(`^${patt}$`);
    }

    _parseUrl(url) {
        let [path, queryString] = url.split('?');
        path = this._trim(path.replace(/\/{2,}/g, '/'), '/');
        const queryParams = {};
        queryString?.split('&').forEach(param => {
            const [key, value] = param.split('=');
            queryParams[key] = value;
        });
        return { path, queryString, queryParams };
    }

    _log(msg) {
        if (this._logger) {
            // TODO
        } else {
            console.log(msg);
        }
    }

    _objMerge(...obj) {
        return Object.assign({}, ...obj);
    }

    _trim(str, char) {
        const rgx = new RegExp(`^\\${char}*|\\${char}*$`, 'g');
        return str.replace(rgx, '');
    }

    /**
     * @param {string} url - <path>[?<queryString>] - without domain.
     * @return {IMatch | undefined}
     */
    matchUrl(url) {
        let ret;
        let match;
        let params;
        const urlData = this._parseUrl(url);
        let route = this._routes.find(route => {
            if (route.regex) {
                match = route.regex.exec(urlData.path);
                params = match?.groups;
            } else {
                match = route.path?.(urlData.path);
                params = (match instanceof Object) ? match : null;
            }
            return match;
        });

        if (!match) {
            route = this._notFoundRoute;
        }

        if (route) {
            params = this._objMerge({}, params);
            if (params._restString) {
                params.restParams = params._restString.split('/');
            }
            params.queryParams = urlData.queryParams;
            ret = { route, params }
        }

        return ret;
    }
}

module.exports = URouter;