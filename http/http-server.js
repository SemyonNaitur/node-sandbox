'use strict'
const http = require('http');

/**
 * @typedef { import('../utils/router').URouter } URouter
 */

class HttpServer {
    /** @type {URouter} */
    _router;
    /** @type {Object} */
    _logger;
    /** @type {Server} */
    _server;
    _created = false;
    /** @type {number} */
    _listeningOn;
    _params = {
        defaultHeaders: {},
    };

    /**
     * @param {URouter} router 
     * @param {*} [logger]
     */
    constructor(router, logger, params) {
        this._router = router;
        this._logger = logger;
        this.params(params);
    }

    _matchUrl(url) {
        return this._router.matchUrl(url);
    }

    _log(msg) {
        if (this._logger) {

        } else {
            console.log(msg);
        }
    }

    _objMerge(...obj) {
        return Object.assign({}, ...obj);
    }

    /**
     * @param {Object} [params] 
     * @return {Object | void}
     */
    params(params) {
        if (!params) {
            return this._objMerge({}, this._params);
        }
        if (typeof params !== 'object') throw new TypeError(`Invalid params object ${params}`);
        this._params = this._objMerge(this._params, this._objMerge({}, params));
    }

    /**
     * @param {string} property 
     * @param {*} value 
     * @return {*}
     */
    param(property, value) {
        if (typeof value === 'undefined') {
            const val = this._params[property];
            return (val && (typeof val === 'object')) ? this._objMerge({}, val) : val;
        }
        const update = {};
        update[property] = this._objMerge({}, value);
        this._params = this._objMerge(this._params, update);
    }

    /**
     * @return {HttpServer}
     */
    createServer() {
        if (this._created) throw new Error('Server already created');
        const server = http.createServer((req, res) => {
            this._log('--- Request start ---');
            this._log(req.url);
            const matched = this._matchUrl(req.url);

            if (!matched) {
                res.writeHead(404);
                res.end('Not Found.');
            } else {
                matched.route.func(req, res, matched.params);
            }
            this._log('--- Request end ---');
        });
        this._server = server;
        this._created = true;
        return this;
    }

    /**
     * @param {number} port 
     */
    listen(port) {
        if (this._listeningOn) throw new Error('Server already listening');
        if (parseInt(port) != port) throw new Error(`Invalid port: ${port}`);
        this._server.listen(port);
        this._listeningOn = port;
        this._log(`--- Listening on port ${port}`);
    }

    /**
     * @param {IncomingMessage} req
     * @return {string} 
     */
    getUri(req) {
        // TODO: handle scheme
        return `http://${req.headers.host}${req.url}`;
    }

    /**
     * @param {ServerResponse} res 
     * @param {string} data 
     * @param {number} [code=200] 
     * @param {Object} [headers={}]
     */
    writeHtml(res, data, code = 200, headers = {}) {
        headers = this._objMerge(this.param('defaultHeaders'), headers, { 'Content-Type': 'text/html' });
        res.writeHead(code, headers);
        res.write(data);
        res.end();
    }

    /**
     * @param {ServerResponse} res 
     * @param {string} data 
     * @param {number} [code=200] 
     * @param {Object} [headers={}]
     */
    writeJson(res, data, code = 200, headers = {}) {
        headers = this._objMerge(this.param('defaultHeaders'), headers, { 'Content-Type': 'application/json' });
        res.writeHead(code, headers);
        res.write(data);
        res.end();
    }

    /**
     * @param {ServerResponse} res 
     * @param {string} to 
     * @param {301 | 302} [code=301] 
     */
    redirect(res, to, code = 301) {
        this._log(`Redirecting to ${to} with code ${code}`);
        res.writeHead(code, { "Location": to });
        res.end();
    }
}

module.exports = HttpServer;