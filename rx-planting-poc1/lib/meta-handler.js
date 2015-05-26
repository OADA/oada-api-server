var log = require.main.require('./lib/logger.js').child({ module: 'meta-handler' });
var db = require.main.require('./lib/memory-db.js');
var oada_util = require.main.require('./lib/oada-util.js');
var resources_handler = require.main.require('./lib/resources-handler.js');

var _MetaHandler = {

  rewriteRequest: function(req) {
    req.url = req.url.replace(/^\/meta\/([^\/]+)/, '/resources/meta:$1');
    return req;
  },

  get: function(req,res) {
    log.info("GET", req.url);
    return resources_handler.get(_MetaHandler.rewriteRequest(req), res);
  },
  put: function(req,res) {
    log.info("PUT" + req.url);
    return resources_handler.put(_MetaHandler.rewriteRequest(req), res);
  },
  post: function(req,res) {
    log.info("POST " + req.url);
    return resources_handler.post(_MetaHandler.rewriteRequest(req), res);
  },
  delete: function(req,res) {
    log.info("DELETE" + req.url);
    return resources_handler.delete(_MetaHandler.rewriteRequest(req), res);
  },
};

module.exports = _MetaHandler;
