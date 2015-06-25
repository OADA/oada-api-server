var log = require.main.require('./lib/logger.js').child({ module: 'meta-handler' });

var _MetaHandler = express.Router();

// Just rewrite the url to have /resources/meta:<id> instead of
// /meta/<id>, then move on to next handler which should eventually
// include /resources.
_MetaHandler.use(/^\/meta(\/.*)?/, function(req, res, next) {
  log.info(req.method + ' ' + req.url);
  req.url = req.url.replace(/^\/meta\/([^\/]+)/, '/resources/meta:$1');
  next();
});

module.exports = _MetaHandler;
