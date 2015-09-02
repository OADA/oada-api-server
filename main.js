console.log('main1');
// Require the global config that houses all the libraries, settings, etc:
var config = require('./config.js')();

console.log('main2');
// Require the server, passing it this config to build itself
var server = require('./server.js')(config);

console.log('main3');
// Start the server, which starts the rev-graph update as well.
return server.start();

