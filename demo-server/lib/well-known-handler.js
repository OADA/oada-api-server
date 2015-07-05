var log = require.main.require('./lib/logger.js').child({ module: 'well-known-handler' });
var config = require.main.require('./config.js');
var oada_error = require('./lib/oada-errors.js');

var _WellKnownHandler = {
  get: function(req,res) {
    log.info("GET ",  req.url);

    if (req.url !== "/.well-known/oada-configuration") {
      throw new oada_error.OADAError('/.well-known/oada-configuration not found!', oada_error.codes.NOT_FOUDN);
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
