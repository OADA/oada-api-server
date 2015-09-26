var Promise = require('bluebird');
Promise.longStackTraces();
var fs = require('fs');
var path = require('path');
var Formats = require('oada-formats');

var static_config = {
  server: {
    protocol: "https://",
    domain: (process.env.OADA_API_DOMAIN ? process.env.OADA_API_DOMAIN : 'localhost'),
    port: 3000,
    path_prefix: '/',
  },
}

var singleton = null;
module.exports = function() {
  if (singleton) return singleton;

  var _Config = {

    name: 'OADA API server',
    log_level: 'info',  // trace, debug, info, warn, error, fatal

    // Things needed to start the server:
    // (Has to be a function because it refers to other _Config info
    server: {
         protocol: static_config.server.protocol,
           domain: static_config.server.domain,
             port: static_config.server.port,
      path_prefix: static_config.server.path_prefix,
             mode: static_config.server.protocol.replace(/:\/\//,''), // for oada-ref-auth
      // For https (these are self-signed: replace with yours):
      certs: {
        key: fs.readFileSync(path.join(__dirname, 'certs/ssl/server.key')),
        cert: fs.readFileSync(path.join(__dirname, 'certs/ssl/server.crt')),
        ca: fs.readFileSync(path.join(__dirname, 'certs/ssl/ca.crt')),
        requestCrt: true,
        rejectUnauthorized: false,
      },
    },

    // Things that should go in the /.well-known/oada-configuration:
    // (Has to be a function because it refers to other _Config info
    oada_configuration: {
      well_known_version: '1.0.0',
      oada_base_uri: static_config.server.protocol
                    +static_config.server.domain
                    +(static_config.server.port ? ':'+static_config.server.port : '' )
                    +static_config.server.path_prefix,
      scopes_supported: [
        {
          name: 'oada.all.1', // can do anything the user can do
          /* pattern: /oada\..*\.1/  */
          'read+write': true, // can read/write anything the user can read/write
        }
      ],
    },

    // If you want to hard-code the token used for testing, uncomment the auth below:
    test: {
      auth: {
        token: "SJKF9jf309", // Hard-coded token for easy API testing
      },
    },


    // Modules to use for this setup:
    libs: {
      // Any initial database setups (for testing, etc.)
      initial_setup: function() {
        return require('./dbsetups/valleyix.js')(_Config);
      },

      // Rev graph updater
      rev_graph: function() {
        return require('./lib/rev-graph.js')(_Config);
      },

      // What you want to use for logging: needs to support
      // child(), info(), error(), debug(), fatal(), trace()
      log: function() {
        return require('./lib/logger.js')(_Config);
      },

      // Library used for format examples and validation:
      formats: function() {
        return new Formats({
            debug: function() {
                return _Config.libs.log().info.bind(_Config.libs.log());
            },
            error: function() {
                return _Config.libs.log().error.bind(_Config.libs.log());
            }
        });
      },

      db: {

        // Bottom-level database, used by all the other database libs.
        // Yes, I know it's weird to have _Config.db.db(), but hey, it works here.
        db: function() {
          return require('./lib/memory-db/memory-db.js')({
            // MemoryDB has an optional persistence module that periodically writes
            // the entire in-memory database to a file, and loads it when the server
            // starts.  You can comment the persistence line below to disable.
            persistence: function() {
              return require('./lib/memory-db/memory-db-persistence.js')({
                // moved data above this directory because forever keeps restarting despite --watchIgnore...
                output_file: (process.env.ISDOCKER ? '/data/current_db.js' : '../data/current_db.js'),
                libs: _Config.libs,
              });
            },

            libs: _Config.libs,
          });
        },

        // Drivers for higher-level components to interact with database:
        // Note that they each use _Config.libs.log and _Config.libs.db.db
        // at minimum.
        resources: function() { return require('./lib/memory-db/memory-db-resources-driver.js')(_Config); },
        tokens:    function() { return require('./lib/memory-db/memory-db-genericgetset-driver.js')(_Config)('tokens'); },
        users:     function() { return require('./lib/memory-db/memory-db-genericgetset-driver.js')(_Config)('users'); },
        client:    function() { return require('./lib/memory-db/memory-db-genericgetset-driver.js')(_Config)('clients'); },
        code:      function() { return require('./lib/memory-db/memory-db-genericgetset-driver.js')(_Config)('codes'); },
      },

      // Datastores needed for oada-ref-auth (they use the db libs defined above)
      auth: {
        datastores: {
          clients: function() { return require('./lib/auth/clients.js')(_Config); },
          users:   function() { return require('./lib/auth/users.js')(_Config); },
          codes:   function() { return require('./lib/auth/codes.js')(_Config); },
          tokens:  function() { return require('./lib/auth/tokens.js')(_Config); },
        },
      },

      // URL handlers:
      handlers: {
        resources: function() { return require('./lib/resources-handler.js')(_Config); },
        bookmarks: function() { return require('./lib/bookmarks-handler.js')(_Config); },
        meta:      function() { return require('./lib/meta-handler.js')(_Config); },
      },

      // Misc:
      scopes:           function() { return require('./lib/scopes.js')(_Config) },
      mediatype_parser: function() { return require('./lib/mediatype-parser.js')(_Config) },
      error:            function() { return require('./lib/errors.js')(_Config) },
      validator:        function() { return require('./lib/oada-resource-validator.js')(_Config) },
      util:             function() { return require('./lib/oada-util.js')(_Config) },
    },

    ///////////////////////////////////////////////////////////////////
    // Functions to mess with dependency injection

    // replaces any factory function with a new factory function.  Call this before
    // anybody else tries to use any of the factory function and you'll be fine using it.
    override: function(new_opt) {
      _.merge(_Config, new_opt);
    },
  };

  singleton = _Config;
  return _Config;
};
