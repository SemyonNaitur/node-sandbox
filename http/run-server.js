'use strict'
const URouter = require('../utils/router');
const HttpServer = require('./http-server');

const routes = [
    { path: '/print-request', func: printRequest },
    { path: 'cat-id-prop/:cat/:id/:prop', func: catIdProp },
    { path: 'cat-id-props/:cat/:id/...', func: catIdProps },
    { path: 'not-found', func: notFound },
];

const namedArgs = extractNamedArgs(process.argv.slice(2));
const port = namedArgs['port'] || namedArgs['p'] || 8080;

const router = new URouter({ routes });
const server = new HttpServer(router);
server.createServer().listen(port);

function extractNamedArgs(args) {
    const ret = {};
    const rgx = /^--?(?<prop>(?<=--)[a-z]+(?:-[a-z]+)*|[a-z])=(?<qt>'|")?(?<val>.*)\k<qt>$/i;
    args.forEach(arg => {
        console.log(arg);
        const match = rgx.exec(arg);
        console.log(match);
        if (match) {
            ret[match.groups.prop] = match.groups.val;
        }
    });
    return ret;
}

//--- route funcs ---//
function printRequest(req, res, params) {
    let data = '';
    for (const prop in req) {
        data += `<br><b>${prop}:</b> `;
        try {
            data += JSON.stringify(req[prop]);
        } catch (e) { }
    }
    server.writeHtml(res, data);
}

function catIdProp(req, res, params) {
    const data = `Displaying property '${params.prop}' of item #${params.id} from category '${params.cat}'.`;
    server.writeHtml(res, data);
}

function catIdProps(req, res, params) {
    if (params.restParams.length === 1) {
        const to = server.getUrl(req).replace(/\/(cat-id-prop)s\//, '/$1/');
        return server.redirect(res, to);
    }
    const data = `Displaying properties '${params.restParams.join()}' of item #${params.id} from category '${params.cat}'.`;
    server.writeHtml(res, data);
}

function notFound(req, res, params) {
    server.writeHtml(res, '<h1>Not Found</h1>', 404);
}
//--- route funcs ---//
