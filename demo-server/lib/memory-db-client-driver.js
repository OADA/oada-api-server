var _ = require('lodash');
var db = require('./memory-db.js');

// Logger:
var log = require('./logger.js').child({ module: 'memory-db-clients-driver' });

var _ClientDriver = {

  set: function(client, opts) {
    return db.set('clients', '/'+client, opts)
    .then(function(info) {
      return true; // don't need to return anything really
    });
  },

  get: function(client) {
    return db.get('clients', '/'+client)
    .then(function(info) {
       info = info || {};
       if (!info.found) delete info.val;
       // don't need the found, existent_path, etc.:
       return info.val;
    });
  },

  delete: function(client) {
    return db.remove('clients', '/'+client)
    .then(function() {
      return true;
    });
  },

  // For testing:
  clean: function() {
    return db.clean('clients');
  },

};

module.exports = _ClientDriver;
