
////////////////////////////////////////////////////////////////////
// This mock server will store all incoming POSTs in memory
// in order to properly respond.  Therefore, if you leave it running
// a long time, it may die.  It is intended to be used for testing,
// not production.
////////////////////////////////////////////////////////////////////

var Promise = require('bluebird');
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
var oada_error = require('oada-error');
var oada_ref_auth = require('oada-ref-auth');

// Local libs:
            var config = require('./config.js')(); // Only server.js includes config: everything else is passed it's config
 var bookmarks_handler = config.libs.handlers.bookmarks();
 var resources_handler = config.libs.handlers.resources();
      var meta_handler = config.libs.handlers.meta();
  var mediatype_parser = config.libs.mediatype_parser();
            var errors = config.libs.error();
               var log = config.libs.log();
         var rev_graph = config.libs.rev_graph();

// Optional Local libs:
var initial_setup = config.libs.initial_setup;
initial_setup = (typeof initial_setup === 'function') ? initial_setup() : false;

return Promise.try(function() {
  log.info('-------------------------------------------------------------');
  log.info('Starting server...');

  // If config requests that DB be setup, run the given setup function:
  if (initial_setup) {
    log.info('Setting up database...');
    return initial_setup.setup();
  }

}).then(function() {

  /////////////////////////////////////////////////////////////////
  // Setup express:
  var app = express();

  // Allow route handlers to return promises:
  app.use(express_promise());

  // Log all requests before anything else gets them for debugging:
  app.use(function(req, res, next) {
    log.info('Received request: ' + req.method + ' ' + req.url);
    log.trace('req.headers = ', req.headers);
    log.trace('req.body = ', req.body);
    next();
  });

  // Turn on CORS for all domains, allow the necessary headers
  app.use(cors({
    exposedHeaders: [ 'x-oada-rev', 'location' ],
  }));
  app.options('*', cors());

  ////////////////////////////////////////////////////////
  //
  // Configure the OADA well-known handler middleware
  var well_known_handler = well_known_json({
    headers: {
      'content-type': 'application/vnd.oada.oada-configuration.1+json',
    },
  });
  well_known_handler.addResource('oada-configuration', config.oada_configuration);
  app.use(well_known_handler);

  // Enable the OADA Auth code to handle OAuth2
  app.use(oada_ref_auth({
    wkj: well_known_handler,
    server: config.server,
    // Weird fix to the self needing config awkwardness
    datastores: _.map(config.libs.auth.datastores, _.invoke)
  }));

  /////////////////////////////////////////////////////////////////
  // Setup the body parser and associated error handler:
  app.use(body_parser.raw({
    limit: '10mb',
    type: function(req) {
      return mediatype_parser.canParse(req);
    }
  }));

  /////////////////////////////////////////////////////////
  // Setup the resources, meta, and bookmarks routes:

  // NOTE: must register bookmarks_handler and meta_handler prior to
  // resources_handler because they call next() to get to the
  // resources handler.
  app.use(config.server.path_prefix, bookmarks_handler);
  app.use(config.server.path_prefix, meta_handler);
  app.use(config.server.path_prefix, resources_handler);

  //////////////////////////////////////////////////
  // Default handler for top-level routes not found:
  app.use(function(req, res){
    throw new oada_error.OADAError('Route not found: ' + req.url, oada_error.codes.NOT_FOUND);
  });

  ///////////////////////////////////////////////////
  // Use OADA middleware to catch errors and respond
  app.use(oada_error.middleware(console.log));

  app.set('port', config.server.port);
  if(config.server.protocol === 'https://') {
    var server = https.createServer(config.server.certs, app);
    server.listen(app.get('port'), function() {
      log.info('OADA Test Server started on port ' + app.get('port')
          + ' [https]');
    });
  } else {
    app.listen(app.get('port'), function() {
      log.info('OADA Test Server started on port ' + app.get('port'));
    });
  }

  /////////////////////////////////////////////////
  // Start the _rev updater
  rev_graph.start();
});
