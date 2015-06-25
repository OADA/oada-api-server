var bunyan = require('bunyan');

var _log = bunyan.createLogger({ name: 'OADA Mock Server', level: 'trace' });

module.exports = _log;
