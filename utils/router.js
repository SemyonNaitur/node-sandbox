'use strict'

class URouter {
    _routes;
    _notFoundRoute;

    /**
     * @param {{routes: Array<{path: string, func: Function}>}} routes
     */
    constructor(config, logger = null) {
        const routes = config?.routes;
        if (!Array.isArray(routes) || routes.length < 1) {
            throw new Error(`Invalid routes array: ${routes}`);
        }
        this._initRoutes(routes);
    }

    _initRoutes(routes) {
        let i = 0;
        this._routes = routes.map(route => {
            if ((typeof route?.path !== 'string') || (typeof route?.func !== 'function')) {
                throw new Error('Invalid route: ' + route);
            }
            if (route.path === 'not-found') {
                this._notFoundRoute = route;
            }
            return this._parsePath(route);
        });
    }

    /**
     * Transforms the path to a regex by replacing each named url segment
     * with a corresponding named capturing group - e.g., :id -> (?<id>[^/]+)
     * A trailing '/...' notation is transformed to '_restString' group.
     * 
     * Leading '/' is removed.
     */
    _parsePath(route) {
        let patt = route.path.replace(/^\//, ''); // remove leading '/'
        patt = patt.replace(/:([^/]+)/g, '(?<$1>[^/]+)'); // parse params
        patt = patt.replace(/\.{3}$/, '(?<_restString>.+)?'); // parse rest string
        this._log(patt);
        const rgx = new RegExp(`^${patt}$`);
        return Object.assign({}, route, { rgx });
    }

    _parseUrl(url) {
        let [path, queryString] = url.split('?');
        path = path.replace(/\/{2,}/g, '/').replace(/^\/|\/$/g, '');
        const queryParams = {};
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            queryParams[key] = value;
        });
        return { path, queryString, queryParams };
    }

    _log(msg) {
        if (this._logger) {

        } else {
            console.log(msg);
        }
    }

    /**
     * @param {string} url - <path>[?<queryString>] - without domain.
     * @return {{path: string, func: Function, params: Object.<string, string>} | undefined}
     */
    matchUrl(url) {
        let ret;
        let match;
        const urlData = this._parseUrl(url);
        let matchedRoute = this._routes.find(route => {
            match = route.rgx.exec(urlData.path);
            return match;
        });

        if (!match) {
            matchedRoute = this._notFoundRoute;
        }

        if (matchedRoute) {
            const params = Object.assign({}, match?.groups);
            if (params._restString) {
                params.restParams = params._restString.split('/');
            }
            params.queryParams = urlData.queryParams
            ret = {
                path: matchedRoute.path,
                func: matchedRoute.func,
                params
            }
        }

        return ret;
    }
}

module.exports = URouter;