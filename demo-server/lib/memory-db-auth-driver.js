var _ = require('lodash');
var db = require('./memory-db.js');

// Logger:
var log = require('./logger.js').child({ module: 'memory-db-auth-driver' });

var _AuthDriver = {

  set: function(token, opts) {
    return db.set('tokens', '/'+token, opts)
    .then(function(info) {
      return true; // don't need to return anything really
    });
  },

  get: function(token) {
    return db.get('tokens', '/'+token)
    .then(function(info) {
       info = info || {};
       if (!info.found) delete info.val;
       // don't need the found, existent_path, etc.:
       return info.val;
    });
  },

  delete: function(token) {
    return db.remove('tokens', '/'+token)
    .then(function() {
      return true;
    });
  },

  // For testing:
  clean: function() {
    return db.clean('tokens');
  },

};

module.exports = _AuthDriver;
