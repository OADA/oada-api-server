// Simple, completely non-scalable persistence layer for quick-and-dirty
// testing.  Just serializes the entire memory db to a file on every 
// database update.  
// Advantage: give it JSON and you have a database.
// Disadvantage: really slow to seralize the whole thing every time.
//   * may extend this in the future to just use redis
//

var Promise = require('bluebird');
var _ = require('lodash');
var fs = Promise.promisifyAll(require('fs'));
var mkdir = require('mkdir-recursive');
var path = require('path');

var singleton = null;

module.exports = function(config) {
  config = config || {};
  if (singleton && !config.forcenew) return singleton;

  var log = config.libs.log().child({ module: 'memory-db-persistence' });

  config.output_file = config.output_file || "current_db.js";
  // Make sure the parent directory exists where the persistent file will be written:
  mkdir.mkdirSync(path.dirname(config.output_file, '0700'));

  var pending_writes = false;
  var had_to_wait = false;

  var _MemoryDBPersistence = {

    loadFullDb: function() {
      try {
        return require.main.require(config.output_file); // who needs JSON.parse?
      } catch(e) {
        return {}; // file doesn't exist, just start with empty db
      };
    },
    
    dbUpdated: function(info) {
      // probably not as long as you don't kill the system while 
      // existing writes are pending things will be fine....
      if (pending_writes) {
        log.trace('dbUpdated: pending_writes = true, returning');
        had_to_wait = true;
        return false; // can't write until other ones finish
      }
      pending_writes = true;
      log.trace('dbUpdated: writing database to file');
      return fs.writeFileAsync(config.output_file, "module.exports = " + JSON.stringify(_.clone(info.db)))
      .then(function() { 
        // If there has been more activity, schedule function to run again right away,
        // but break the recursion chain with setTimeout so we don't overflow the stack
        log.trace('dbUpdated: setting pending_writes = false');
        pending_writes = false;
        if (had_to_wait) { // somebody was waiting on us to finish, so reschedule ourselves to run
          log.trace('dbUpdated: there are pending writes, calling setTimeout');
          setTimeout(_MemoryDBPersistence.dbUpdated.bind(this), 0, info);
          log.trace('dbUpdated: setting had_to_wait = false');
          had_to_wait = false;
        }
        return true;
      });
    },
  };

  singleton = _MemoryDBPersistence;
  return singleton;
};

