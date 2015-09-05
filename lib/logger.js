var bunyan = require('bunyan');

var logger = null;

var _log = function(config) {
  if (!logger) {
    logger = bunyan.createLogger({ name: config.name, level: config.log_level });
  }
  return logger; 
};

module.exports = _log;
