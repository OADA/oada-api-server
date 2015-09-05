// Require the global config that houses all the libraries, settings, etc:
var config = require('./config.js')();

// Require the server, passing it this config to build itself
var server = require('./server.js')(config);

// Start the server, which starts the rev-graph update as well.
return server.start();

