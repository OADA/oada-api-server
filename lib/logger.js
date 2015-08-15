var bunyan = require('bunyan');

var logger = null;

var _log = function() {
  if (!logger) logger = bunyan.createLogger({ name: 'OADA Mock Server', level: 'trace' });
  return logger; 
};

module.exports = _log;
