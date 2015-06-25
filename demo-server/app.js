
////////////////////////////////////////////////////////////////////
// This mock server will store all incoming POSTs in memory
// in order to properly respond.  Therefore, if you leave it running
// a long time, it may die.  It is intended to be used for testing,
// not production.
////////////////////////////////////////////////////////////////////

var express = require('express');
var express_promise = require('express-promise');
var uuid = require('node-uuid');
var _ = require('lodash');
var body_parser = require('body-parser');
var bunyan = require('bunyan');
var content_type_parser = require('content-type');
var cors = require('cors');
var fs = require('fs');
var https = require('https');
var well_known_json = require('well-known-json');

// Local libs:
var well_known_handler = require.main.require('./lib/well-known-handler.js');
 var bookmarks_handler = require.main.require('./lib/bookmarks-handler');
 var resources_handler = require.main.require('./lib/resources-handler');
      var meta_handler = require.main.require('./lib/meta-handler');
            var config = require.main.require('./config');
               var log = require.main.require('./lib/logger.js');
            var errors = require.main.require('./lib/errors.js');

log.info('-------------------------------------------------------------');
log.info('Starting server...');

/////////////////////////////////////////////////////////////////
// Setup express:
var app = express();

// Allow route handlers to return promises:
app.use(express_promise());

// Turn on CORS for all domains, allow the necessary headers
app.use(cors({ 
  exposedHeaders: [ 'x-oada-rev', 'location' ],
}));
app.options('*', cors());


/////////////////////////////////////////////////////////////////
// Setup the body parser and associated error handler:
app.use(body_parser.raw({ 
  limit: '10mb',
  type: function(req) {
    // Need to parse content type because they have parameters like ;charset=utf-8
    var obj = content_type_parser.parse(req.headers['content-type']);
    // Replace this with the server config's list of supported media types
    // (Just use the .well-known/oada-configuration?)
    return mediatype_parser.canParse(_.get(obj, "type", "");
  }
}));
// Error handler, called if body parser fails:
app.use(function(err, req, res, next) {
  log.info('parser error? err = ', err);
  log.info('parser error? req = ', req);
  next();
});


/////////////////////////////////////////////////////////
// Setup the resources, meta, and bookmarks routes:

// NOTE: must register bookmarks_handler and meta_handler prior to 
// resources_handler because they call next() to get to the 
// resources handler.
app.use(config.oada_base_uri, bookmarks_handler);
app.use(config.oada_base_uri, meta_handler);
app.use(config.oada_base_uri, resources_handler);


////////////////////////////////////////////////////////
// Configure the OADA well-known handler middleware
var well_known_handler = well_known_json({
  headers: {
    'content-type': 'application/vnd.oada.oada-configuration.1+json',
  },
});
well_known_handler.addResource('oada-configuration', config.wellKnown);
app.use(well_known_json);


//////////////////////////////////////////////////
// Default handler for top-level routes not found:
app.use(function(req, res){
  throw new Error("NOT FOUND IN APP.JS: USE OADA ERRORS MIDDLEWARE!");

  log.info('NOT FOUND: ', req.url);
  return oada_errors.notFoundError(res);
});

app.set('port', 3000);
app.listen(rest.get('port'), function() {
  log.info('OADA Test Server started on port ' + app.get('port'));
});
