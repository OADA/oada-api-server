var _ = require('lodash');
var db = require('./memory-db.js');

// Logger:
var log = require('./logger.js').child({ module: 'memory-db-codes-driver' });

var _CodeDriver = {

  set: function(code, opts) {
    return db.set('codes', '/'+code, opts)
    .then(function(info) {
      return true; // don't need to return anything really
    });
  },

  get: function(code) {
    return db.get('codes', '/'+code)
    .then(function(info) {
       info = info || {};
       if (!info.found) delete info.val;
       // don't need the found, existent_path, etc.:
       return info.val;
    });
  },

  delete: function(code) {
    return db.remove('codes', '/'+code)
    .then(function() {
      return true;
    });
  },

  // For testing:
  clean: function() {
    return db.clean('codes');
  },

};

module.exports = _CodeDriver;
