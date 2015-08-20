var Promise = require('bluebird');
var _ = require('lodash');
var pointer = require('json-pointer');
var uuid = require('uuid');

var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  config = config || {};

  var log = config.libs.log();
  var persistence = config.persistence; // factory function or nothing
  persistence = (typeof persistence === 'function') ? persistence() : false;

  
  var db = {};

  // If a persistence driver was provided, initialize the in-memory db from the persistence
  // layer instead of the empty one we just made in memory.
  if (persistence) {
    db = persistence.loadFullDb();
  }
  db = db || {};

  var path_pointer = {
    // get will return an object with the value it found, the existent part of the
    // path, and the non-existent part of the path
    get: function(obj, path) {
      if (!path || typeof path !== 'string') {
        log.error('path_pointer.get: path is not a string')
        return null;
      }
      if (!path.match(/^\//)) path = '/' + path; // json-pointer likes leading slashes
      if (path.match(/^\/$/)) path = ''; // json-pointer doesn't like ONLY slashes
      var parts = pointer.parse(path);
      var ret = {
        found: false,
        existent_path: '',
        nonexistent_path: path,
        val: obj,
        parent: obj,
      };
      for(var i in parts) {
        var p = parts[i];
  
        // If this part of the path is not found, val should remain the same as
        // 'the last thing we were able to find'.  It will be the same as parent
        // in this case.  Note that since 'p' is the result of pointer.parse, you
        // can't use pointer.has because it's already escaped the slashes and tildes.
        if (!_.has(ret.val, p)) {
          ret.existent_path = pointer.compile(parts.slice(0, i));
          ret.nonexistent_path = pointer.compile(parts.slice(i));
          ret.found = false;
          // ret.val, ret.existent_path, and ret.found are already set properly
          break;
        }
  
        // Otherwise, we found this part, so keep it as the current value and
        // go look for the next one.  We can't use pointer.get because pointer.parse
        // above already removed all the escaped characters in the path.
        ret.parent = ret.val;
        ret.val = ret.val[p];
        // include this key in the existent path (+1)
        ret.existent_path = pointer.compile(parts.slice(0, i+1));
        ret.nonexistent_path = '';
        ret.found = true; // A later part of the loop may set this back to false.
      }
      return ret;
    },
  
    // Set will create the path all the way to "obj" if it does not exist
    set: function(obj, path, new_val) {
     if (!path || typeof path !== 'string') {
        log.error('path_pointer.set: path is not a string')
        return false;
      }
      if (!obj) {
        log.error('path_pointer.set: cannot set a path on a null object');
        return false;
      }
      if (!path.match(/^\//)) path = '/' + path; // json-pointer likes leading slashes
      if (path.match(/^\/$/)) path = ''; // json-pointer doesn't like ONLY slashes
      // The path cannot be empty if you want to set something:
      if (pointer.parse(path).length < 1) {
        log.error('path_pointer.set: path is empty');
        return false;
      }
      var info = this.get(obj, path);
      // Create any non-existent path.  Note that json-pointer has similar functionality
      // built-in to 'set', but it throws a TypeError exception when the thing you're
      // something along the path you're replacing is not an object.  So, we roll our own.
      // This thing took me several days to get working properly.  I'm leaving my examples
      // in comments below for future travelers:
      // Here are some examples illustrating what's about to happen below:
      // set /resources/123 -> set /123, obj = resources_map
      //   resources_map['123'] = val, and resources_map must exist
      //   if 123  exists: nonexistent_parts = ''   , found = true , existent_parts = 123, parent = resources_map
      //   if 123 !exists: nonexistent_parts = '123', found = false, existent_parts = '' , parent = resources_map
      // set /resources/123/a/b -> set(resources_map, /123/a/b),
      //   if /123/a/b  exists: nonexistent_parts = ''        , found = true , existent_parts = /123/a/b, parent = /123/a
      //   if /123/a/b !exists: nonexistent_parts = 'b'       , found = false, existent_parts = /123/a  , parent = /123/a
      //   if /123/a   !exists: nonexistent_parts = '/a/b'    , found = false, existent_parts = /123    , parent = /123
      //   if /123     !exists: nonexistent_parts = '/123/a/b', found = false, existent_parts =         , parent = resources_map
  
      var existent_parts = pointer.parse(info.existent_path);
      var nonexistent_parts = pointer.parse(info.nonexistent_path);
  
      // Don't include the first key, because it will be the one we set in the final object
      var parts_to_create = nonexistent_parts.slice(1);
      if (parts_to_create.length > 0) {
        var tmp_val = {};
        var path_to_create = pointer.compile(parts_to_create);
        pointer.set(tmp_val, path_to_create, new_val);
        new_val = tmp_val;
      }
      // Now new_val is the correct 'new' thing to insert into the parent at the end
      // of the existent path.
  
      // If we found the thing, we need it's parent in order to change it.
      var parent_to_change = info.parent;
      // and the key is the end of the existent parts:
      var key_to_set = _.get(existent_parts, existent_parts.length - 1, null);
  
      // If we did not find it, key is start of nonexistent_parts, and parent
      // is last thing found.
      if (!info.found) {
        key_to_set = _.get(nonexistent_parts, 0, null);
        parent_to_change = info.val;
  
        // If the last thing found is not an object, we can't set a key on it.
        // we'll therefore need to replace it in it's parent with an object.
        // This means moving back up the path one more level: from the front of the
        // non-existent path to the end of the existent path, and make a new object
        // to set in the database containing the last existing key which we'll replace.
        if (typeof parent_to_change !== 'object') {
          parent_to_change = info.parent;
          var tmpval = {};
          tmpval[key_to_set] = new_val;
          new_val = tmpval;
          key_to_set = _.get(existent_parts, existent_parts.length - 1, null);
        }
      }
      if (!key_to_set) {
        log.error('path_pointer.set: could not find key to set!');
        return false;
      }
      if (!parent_to_change) {
        log.error('path_pointer.set: there is no parent to change!');
        return false;
      }
  
      // Finally, time to set the thing (note these are references within
      // the actual database):
      parent_to_change[key_to_set] = new_val;

      if (persistence) {
        persistence.dbUpdated({ db: db });
      }

      return true;
    },
  
  };
  
  var _MemoryDb = {
  
    // get will return an object representing the search for path:
    // {
    //   found: true|false,
    //   val: what_was_found_at_existent_path,
    //   existent_path: 'part/of/path/that/exists'
    //   nonexistent_path: 'part/that/does/not/exist'
    // }
    // if opts.noval, then val will be null instead of a clone of the database copy.
    // if opts.type_and_length, then it will return the type (and length if an object) of the thing.
    get: function(dbname, path, opts) {
      path = path || '';
      return Promise.try(function() {
        opts = opts || {};
        if (!path.match(/^\//)) path = '/' + path; // path has to have leading / for jsonpointer
        // Check if database exists, create if it doesn't:
        if (!_.has(db, dbname)) {
          db[dbname] = {};
        }
        var ret = path_pointer.get(db[dbname], path);
        // Return a copy of the value:
        if (ret.parent) delete ret.parent; // Don't want to return references to /resources
        if (ret.existent_path == '') { // nothing exists, don't return the entire database for val:
          ret.val = null;
        }
  
        if (opts.type_and_length) {
          ret.type = (typeof ret.val);
          if (_.isArray(ret.val)) ret.type = 'array';
          if (ret.val && typeof ret.val === 'object') ret.length = ret.val.length;
        }
  
        if (opts.noval) {
          ret.val = null;
        } else {
          ret.val = _.cloneDeep(ret.val);
        }
        return ret;
      });
    },
  
    set: function(dbname, path, val) {
      return Promise.try(function() {
        // Check if database exists:
        if (!_.has(db, dbname)) {
          db[dbname] = {};
        };
        var ret = path_pointer.set(db[dbname], path, _.cloneDeep(val));
        return ret;
      });
    },
  
    remove: function(dbname, path) {
      path = path || '';
      return Promise.try(function() {
        if (!path.match(/^\//)) path = '/' + path;
        if (!_.has(db, dbname)) {
          return; // can't remove something from a DB that doesn't exist.
        }
        // pointer.remove doesn't tell you whether the thing existed to
        // remove or not.  It just removes it if it's currently there.
        try {
          pointer.remove(db[dbname], path);
          if(persistence) {
            persistence.dbUpdated({ db: db });
          }
        } finally {
          return true;
        }
      });
    },
  
    uniqueId: function() {
      return uuid.v4().replace(/-/g,''); // the -'s are ugly
    },
  
    /////////////////////////////////////////////////
    // For debugging:
    printContents: function() {
      log.debug(db);
    },
  
    clean: function(dbname) {
      return Promise.try(function() {
        db[dbname] = {};
        return true;
      });
    },
  
    getFullDb: function(dbname) {
      return Promise.try(function() {
        if (!_.has(db, dbname)) {
          log.error('getFullDb: unknown database ' + dbname);
          throw new Error('getFullDb: unknown database ' + dbname);
        };
        return _.cloneDeep(db[dbname]);
      });
    },
  
  };

  singleton = _MemoryDb;
  return singleton;
};

