var _ = require('lodash');
var db = require('./memory-db.js');

// Logger:
var log = require('./logger.js').child({ module: 'memory-db-users-driver' });

var _UserDriver = {

  set: function(user, opts) {
    return db.set('users', '/'+user, opts)
    .then(function(info) {
      return true; // don't need to return anything really
    });
  },

  get: function(user) {
    return db.get('users', '/'+user)
    .then(function(info) {
       info = info || {};
       if (!info.found) delete info.val;
       // don't need the found, existent_path, etc.:
       return info.val;
    });
  },

  delete: function(user) {
    return db.remove('users', '/'+user)
    .then(function() {
      return true;
    });
  },

  // For testing:
  clean: function() {
    return db.clean('users');
  },

};

module.exports = _UserDriver;
