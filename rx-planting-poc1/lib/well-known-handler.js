var log = require.main.require('./lib/logger.js').child({ module: 'well-known-handler' });
var oada_errors = require.main.require('./lib/oada-errors.js');
var config = require.main.require('./config.js');

var _WellKnownHandler = {
  get: function(req,res) {
    log.info("GET ",  req.url);

    if (req.url !== "/.well-known/oada-configuration") {
      return oada_errors.notFoundError(res);
    }
    // Otherwise, respond intelligently:
    res.set("Content-Type", "application/vnd.oada.oada-configuration.1+json");
    res.json({
      "oada_base_uri": config.protocol + req.headers.host,
    });
    res.end();
  },

};

module.exports = _WellKnownHandler;
