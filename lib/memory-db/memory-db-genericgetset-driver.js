// Pass this file the name of the database you want,
// and you'll get back an object with get/set/delete/clean
// for that database.

var _ = require('lodash');

var singletons = {};

// Curry this function to get the final factory function you want:
// i.e. driver(config)('dbname')
module.exports = function(config) {
  var db = config.drivers.db.db();

  return function(dbname) {
    if (singletons[dbname]) return singletons[dbname];

    var log = config.drivers.log().child({ module: 'memory-db-genericgetset-driver('+dbname+')' });

    var _Driver = {

      set: function(x, opts) {
        return db.set(dbname, '/'+x, opts)
        .then(function(info) {
          return true; // don't need to return anything really
        });
      },

      get: function(x) {
        return db.get(dbname, '/'+x)
        .then(function(info) {
           info = info || {};
           if (!info.found) delete info.val;
           // don't need the found, existent_path, etc.:
           return info.val;
        });
      },

      delete: function(x) {
        return db.remove(dbname, '/'+x)
        .then(function() {
          return true;
        });
      },

      // For testing:
      clean: function() {
        return db.clean(dbname);
      },
    };

    singletons[dbname] = _Driver;
    return singletons[dbname];
  };
};



