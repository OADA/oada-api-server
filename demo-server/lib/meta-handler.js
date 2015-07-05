var Promise = require('bluebird');
var express_router = require('express-promise-router');

var log = require('./logger.js').child({ module: 'meta-handler' });

var _MetaHandler = express_router();

// Just rewrite the url to have /resources/meta:<id> instead of
// /meta/<id>, then move on to next handler which should eventually
// include /resources.
_MetaHandler.all(/^\/meta/, function(req, res) {
  return Promise.try(function() {
    log.info(req.method + ' ' + req.url);
    req.url = req.url.replace(/^\/meta(\/)?/, '/resources/meta:');
    return 'next';
  });
});

module.exports = _MetaHandler;
