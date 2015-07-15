
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
 var bookmarks_handler = require('./lib/bookmarks-handler');
 var resources_handler = require('./lib/resources-handler');
      var meta_handler = require('./lib/meta-handler');
            var config = require('./config');
               var log = require('./lib/logger.js');
            var errors = require('./lib/errors.js');
         var rev_graph = require('./lib/rev-graph.js');
  var mediatype_parser = require('./lib/mediatype-parser.js');

return Promise.try(function() {
  log.info('-------------------------------------------------------------');
  log.info('Starting server...');

  // If config requests that DB be setup, run the given setup function:
  if (config.dbsetup) {
    log.info('Setting up database...');
    return config.dbsetup.setup();
  }

}).then(function() {

  /////////////////////////////////////////////////////////////////
  // Setup express:
  var app = express();

  // Allow route handlers to return promises:
  app.use(express_promise());

  // Log all requests before anything else gets them for debugging:
  app.use(function(err, req, res, next) {
    log.info('Received request: ' + req.method + ' ' + req.url);
    next(err);
  });

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
      return mediatype_parser.canParse(req);
    }
  }));

  /////////////////////////////////////////////////////////
  // Setup the resources, meta, and bookmarks routes:

  // NOTE: must register bookmarks_handler and meta_handler prior to
  // resources_handler because they call next() to get to the
  // resources handler.
  app.use(config.wellKnown.oada_base_uri, bookmarks_handler);
  app.use(config.wellKnown.oada_base_uri, meta_handler);
  app.use(config.wellKnown.oada_base_uri, resources_handler);

  ////////////////////////////////////////////////////////
  // Configure the OADA well-known handler middleware
  var well_known_handler = well_known_json({
    headers: {
      'content-type': 'application/vnd.oada.oada-configuration.1+json',
    },
  });
  well_known_handler.addResource('oada-configuration', config.wellKnown);
  app.use(well_known_handler);

  // Enable the OADA Auth code to handle OAuth2
  app.use(oada_ref_auth({
    wkj: well_known_handler,
    server: {
      port: config.port,
      mode: config.protocol === 'https://' ? 'https' : 'http',
      domain: config.domain,
    }
  }));

  //////////////////////////////////////////////////
  // Default handler for top-level routes not found:
  app.use(function(req, res){
    throw new oada_error.OADAError('Route not found: ' + req.url, oada_error.codes.NOT_FOUND);
  });

  ///////////////////////////////////////////////////
  // Use OADA middleware to catch errors and respond
  app.use(oada_error.middleware(console.log));

  app.set('port', config.port);
  if(config.protocol === 'https://') {
    var server = https.createServer(config.certs, app);
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
