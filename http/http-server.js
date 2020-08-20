'use strict'
const http = require('http');
const URouter = require('../utils/router');

class HttpServer {
    /** @type {URouter} */
    _router;
    /** @type {Server} */
    _server;
    /** @type {*} */
    _logger;
    _created = false;
    /** @type {number} */
    _listeningOn;

    /**
     * @param {URouter} router 
     * @param {*} [logger]
     */
    constructor(router, logger) {
        this._router = router;
        this._logger = logger;
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

    /**
     * @return {HttpServer}
     */
    createServer() {
        if (this._created) throw new Error('Server already created');
        const server = http.createServer((req, res) => {
            this._log('--- Request start ---');
            const url = req.url.replace(/\/{2,}/g, '/').replace(/^\/|\/$/g, '');
            this._log(url);
            const matchedRoute = this._matchUrl(url);

            if (!matchedRoute) {
                res.writeHead(404);
                res.end('Not Found.');
            } else {
                this._log(matchedRoute.params);
                matchedRoute.func(req, res, matchedRoute.params);
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
    getUrl(req) {
        return `http://${req.headers.host}${req.url}`;
    }

    /**
     * @param {ServerResponse} res 
     * @param {string} data 
     * @param {number} [code=200] 
     */
    writeHtml(res, data, code = 200) {
        res.writeHead(code, { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
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