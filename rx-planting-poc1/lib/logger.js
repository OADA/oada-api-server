var bunyan = require('bunyan');

var _log = bunyan.createLogger({ name: 'OADA Mock Server', level: 'debug' });

module.exports = _log;
