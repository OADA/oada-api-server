var _ = require('lodash');
var pointer = require('json-pointer');
var Promise = require('bluebird');

// Local libs:
var oada_util = require('./oada-util.js');
var db = require('./memory-db.js');
var rwlock = require('./rwlock-promise.js');
var rev_graph = require('./rev-graph.js');

// Logger:
var log = require('./logger.js').child({ module: 'memory-db-resources-driver' });
db.setLogger(require('./logger.js').child({ module: 'memory-db' }));

var locks = new rwlock();

// What does a db driver do:
// - handle _rev updating
// - handle following links if the db doesn't support it
// - take care of creating new resources and linking _meta as needed
// - merging top-level keys on PUT (i.e. set each one individually)
// - exposes get/put/post/delete
//
// What doesn't a db driver do:
// - handle auth
// - handle scopes
// - handle formats (should it handle binary vs. json formats?)

// Note that all get/put/post/delete return promises.
// The assumption with this driver is that the database knows nothing about
// links between resources or _rev's and this driver has to handle dealing with
// them above the database layer itself.
var _MemoryDbResourcesDriver = {

  // Path should start with the resource id you want to get, not /resources.
  // Get returns a promise which eventually resolves to an 'info' object:
  // { 
  //   found: true|false,
  //   existent_path: '/part/of/path/that/exists'
  //   nonexistent_path: '/part/of/path/that/does/not/exist'
  //   val: clone_of_last_thing_found (i.e. thing at existent_path)
  // }
  // Note that if the thing you are trying to get is a link itself, it will
  // follow the link and return the linked resource rather than the link.
  // opts.noval: return the value, just the paths.  Note the value is still cloned
  //             because this function has to figure out if it's a link or not.
  // opts.type_and_length: return the type (and length if it's an object) of val
  // opts.skip_lock: assumes the thing calling get already has a writeLock, so
  //                 get would busy-wait if it tried to read lock.
  get: function(path, opts) {
    var lock_release = null;
    return Promise.try(function() {
      opts = opts || {};
      var resid = pointer.parse(path)[0]; // resourceid is always first on path
      if (opts.skip_lock) return null; // 'release' function below will be null
      return locks.readLock(resid);  // Can have as many readLock's as you want,
                                     // just not when writing.
    }).then(function(release) {
      lock_release = release;
      return db.get('resources', path, { type_and_length: opts.type_and_length } );

    }).then(function(info) {
      if (lock_release) {
        lock_release();      // Need to release the read lock so any writes may continue
        lock_release = null; // Note that if the lock times out, the promise is rejected 
      }                      // so this code never runs.  Don't have to bother with release
                             // in that case.
      // If the last thing found on the path is a link, follow it whether that
      // was the end of the path or not.
      if (oada_util.isLink(info.val)) {
        var id = info.val._id;
        if (info.val._metaid) id = 'meta:'+info.val._metaid;
        var path_from_linked_resource = '/' + id + info.nonexistent_path;
        // Recursive call to try again with the linked resource:
        return _MemoryDbResourcesDriver.get(path_from_linked_resource, opts);
      }

      if (opts.noval) info.val = null;

      return info;
    }).finally(function() {
      if (lock_release) release();
      lock_release = null;
    });
  },

  // Path should start with the resource id you want to put to, not /resources.
  // Put will merge the top-level keys of the value you pass with the keys 
  // of the thing at path.
  // If the thing you put to doesn't exist, it will create it.
  // If the thing you put to exists, it will only mess with the keys you give in the object
  // opts is optional unless your request will create a resource.  Then it must have 
  // at least the _mediaType in it to store in _meta.
  // Returns a link to the resource that was modified.
  // opts.skip_lock: assumes caller (i.e. POST) already has a write lock.
  put: function(path, topval, opts) {
    var final_path;
    var resourceid;
    var old_rev;
    var lock_release;
    return Promise.try(function() {
      opts = opts || {};
      if (path === '' || path === '/') {
        throw new Error('memory-db-resources-driver.put: Cannot PUT to /resources.');
      };

      // First, we need to get the correct path without any links.  Use get to follow all the links
      // that may show up in the path and find the final path to PUT against.
      return _MemoryDbResourcesDriver.get(path, { noval: true, skip_lock: opts.skip_lock });
    }).then(function(info) {
      // This path now has no links to follow in it:
      final_path = info.existent_path + info.nonexistent_path;
      resourceid = _.get(pointer.parse(final_path), 0, null);
      if (!resourceid) {
        throw new Error('memory-db-resources-driver.put: no resourceid specified');
      }

      // Handle reserved keys: can't put resource-level _id, _rev, or _metaid
      var parts = pointer.parse(final_path);
      var last_part = parts[parts.length-1];
      if (last_part === '_id' || last_part === '_rev' || last_part === '_metaid') {
        throw new Error('memory-db-resources-driver.put: cannot PUT directly to _id, _rev, or _metaid');
      }
      if (parts.length === 1) { // PUT to resource directly
        // Note: only way to create new resources is newEmptyResource, so we should never
        // need to keep any of these keys on the top-level object.
        if (topval._id) delete topval._id;
        if (topval._rev) delete topval._rev;
        if (topval._metaid) delete topval._metaid;
        if (topval._meta) delete topval._meta;
      }
      _util.sanitizeObjectForUpsert(topval);

      if (opts.skip_lock) return null; // no 'release' function if we don't lock
      // writeLock the resource before we get it for merge:
      return locks.writeLock(resourceid);

    }).then(function(release) {
      lock_release = release;
      // Get both the rev on the resource and the val at the path:
      return Promise.props({
        rev_info: db.get('resources', '/'+resourceid+'/_rev'),
        info: db.get('resources', final_path),
      });

    }).then(function(results) {
      results = results || {};
      var info = results.info || {};
      if (results.rev_info) old_rev = results.rev_info.val;

      // If we didn't find it, decide if we're trying to create a resource or
      // just add new stuff to an existing resource:
      if (!info.found) {
        // We know that the top level of the path has to start with the resource.
        // Therefore if there are any 'existent' parts of the path, we're not
        // creating a resource so we can just set it and be done:
        if (info.existent_path !== '') {
          return _util.setWrapper(final_path, topval, old_rev)
          .then(function(new_rev) {
            if (lock_release) {
              lock_release();
              lock_release = null;
            }
            return { link: { _id: resourceid, _rev: new_rev } };
          });
        }
        // Now we know there is no existent_path: if there is no path listed at all, it must
        // have been a PUT to /resources.  Since that's tested for earlier, this shouldn't happen.
        if (info.nonexistent_path === '' || info.nonexistent_path === '/') {
          throw new Error('memory-db-resources-driver.put: make this work with OADAError.  Cannot PUT /resources.');
        }
        // At this point, there must be a nonexistent_path rooted at a non-existent 
        // resource.  Create a new empty resource in the database, then set the path 
        // we need on the new one.
        return _util.newEmptyResource(resourceid, opts._meta)
        .then(function() {
          if (lock_release) {
            lock_release();
            lock_release = null;
          }
          return _MemoryDbResourcesDriver.put(final_path, topval, opts);
        });
      }

      // Otherwise we're changing an existing thing.  Object (merge) or other?
      return Promise.try(function() {
        if (typeof topval !== 'object') { // set it directly
          return _util.setWrapper(final_path, topval);
        }
        // Otherwise it's an object. Loop through all it's keys and merge with existing in DB
        return Promise.map(_.keys(topval), function(key) {
          // can't set _id, _metaid, or _rev from outside:
          if (key === '_id' || key === '_metaid' || key === '_rev') return;
          return _util.setWrapper(final_path + '/' + key, topval[key]);
        });
      }).then(function() {
        // now set the _rev for the whole resource and release the writelock
        return _util.setRev(resourceid, old_rev);
      }).then(function(new_rev) {
        if (lock_release) {
          lock_release();
          lock_release = null;
        }
        return { link: { _id: resourceid, _rev: new_rev } };
      });

    // Don't pop any .then's out at this level because sometimes you get the final link to return,
    // and other times you get the recursive result of calling this function for a new resource.
    }).finally(function() {
      if (lock_release) lock_release();
      lock_release = null;
    });
  },

  // POST will 'append' to an object (new unique id) or array.  It returns:
  // Returns: { 
  //   link: link_obj_to_resource, 
  //   path: path_that_was_created,
  //   key_created: the new ID that was made (last entry on path)
  // }
  post: function(path, val, opts) {
    var final_path;
    var resourceid;
    var old_rev;
    var lock_release;
    var new_id;
    return Promise.try(function() {
      opts = opts || {};

      if (path === '' || path === '/') { // POST /resources
        return null; // no need to writelock anything because resource doesn't exist yet
      }
      resourceid = pointer.parse(path)[0]; // resourceid is always first on path
      return locks.writeLock(resourceid);
    }).then(function(release) {
      lock_release = release;
      // First, we need to get the correct path without any links.  Use get to follow all the links
      // that may show up in the path and find the final path to PUT against.
      return _MemoryDbResourcesDriver.get(path, { noval: true, type_and_length: true, skip_lock: true });
    }).then(function(info) {
      // This path now has no links to follow in it:
      if (!info.found) { // if path doesn't exist, then make it an object and put a new id to it:
        new_id = db.uniqueId();
      } else if (info.type === 'object') { // returns 'array' if it's an array
        new_id = db.uniqueId();
      } else if (info.type === 'array') {
        new_id = info.length;
      } else { // Not an object, we need to replace it with an object and set
        new_id = db.uniqueId();
      }
      final_path = info.existent_path + info.nonexistent_path + '/' + new_id;
      opts.skip_lock = true; // keep the opts._meta if this is creating a new resource
      return _MemoryDbResourcesDriver.put(final_path, val, opts);
    }).then(function(info) {
      if (lock_release) {
        lock_release();
        lock_release = null;
      }
      return { 
        link: info.link, 
        path: final_path, 
        key_created: new_id, 
      };

    }).finally(function() {
      if (lock_release) {
        lock_release();
        lock_release = null;
      }
    });
  },

  delete: function(path) {
    throw new Error('memory-db-resources-driver.delete: Delete not yet implemented');
  },


  // This is really only used by rev_graph to update all the versioned links in a document
  // simultaneously.  Note: parents_already_seen should already have this parentid in it
  updateVersionedLinkList: function(list_of_paths, parentid, childid, new_rev, parents_already_seen) {
    var lock_release;
    return lock.writeLock(parentid)
    .then(function(release) {
      lock_release = release;
      return Promise.map(list_of_paths, function(path, path_index) {
        return db.get('resources', path)
        .then(function(info) {
          // If this path no longer exists on the object, remove it from the list of relationships
          if (!info.found || !oada_util.isVersionedLink(info.val)) {
            return rev_graph.removeParentChildRelationship(childid, parentid, path_index);
          }
          return db.set('resources', path, new_rev);
        });
      });
    }).then(function() {
      return db.get('resources', '/'+parentid+'/_rev');
    }).then(function(info) {
      var parent_old_rev = info.val;
      return _util.setRev(parentid, parent_old_rev, parents_already_seen); 
    }).finally(function() {
      if (lock_release) lock_release();
    });
  },

};


var _util = {

  // setWrapper assumes you've already aquired a write lock for the resource you're trying to
  // update.
  setWrapper: function(path, val, old_rev) {
    var resourceid;
    return Promise.try(function() {
      resourceid = pointer.parse(path)[0]; // Do all the sanitizing outside of this function.

      // Update the content of the resource to fill in revisions for versioned links
      // and list this resource as a parent of each child:
      return _util.updateVersionedLinksInObj(val, resourceid, path)

    // Then put the document in the database.  Note that the _rev for the document is not yet computed.
    }).then(function() {
      return db.set('resources', path, val);
    }).then(function() {
      if (!old_rev) return; // don't return anything if rev wasn't asked to be updated
      return _util.setRev(resourceid, old_rev); // otherwise, return new rev
    });

  },

  // setRev assumes you've already acquired a write lock for the resource whose _rev you're 
  // trying to update.  It will register this path to be handled in the next round of rev-graph
  // updates for any versioned links (in parents or children)
  setRev: function(resourceid, old_rev, parents_already_seen) {
    var new_rev;
    // Note: rev_graph uses parents_already_seen to prevent inifinite update loops
    parents_already_seen = parents_already_seen || {};
    return Promise.try(function() {
      new_rev = rev_graph.incrementRevString(old_rev);
      return db.set('resources', '/'+resourceid+'/_rev', new_rev);
    }).then(function() {
      rev_graph.queueUpdateParents(resourceid, new_rev, parents_already_seen); // synchronous
      return new_rev;
    });
  },


  updateRevInVersionedLink: function(link) {
    var lock_release;
    var link_id = link._id || ('meta:' + link._metaid);

    return locks.readLock(link_id)
    .then(function(release) {
      lock_release = release;
      return db.get('resources', '/' + link_id + '/_rev');
    }).then(function(info) {
      lock_release();
      link._rev = info.val;
      if (!info.found) link._rev = '0-0'; // link does not exist
    });
  },

  updateVersionedLinksInObj: function(obj, resourceid, path_to_here) {
    return Promise.try(function() {
      if (oada_util.isVersionedLink(obj)) {
        return _util.updateRevInVersionedLink(obj);
      }

      return Promise.map(_.keys(obj), function(key) {
        var new_path_to_here = path_to_here + '/' + key;
        var val = obj[key];
        // If it's a string, number, etc., then it can't be a versioned link
        if (typeof val !== 'object') {
          return;
        }
        // If it's not a versioned link but is an object, then we need to try it's props too
        if (!oada_util.isVersionedLink(val)) {
          return _util.updateVersionedLinksInObj(val, resourceid, new_path_to_here);
        }
        // Otherwise, it is a versioned link: get latest and update in obj unless it 
        // points back to the resource it's contained in.
        var link_id = val._id;
        if (val._metaid) link_id = 'meta:' + val._metaid;
        if (link_id === resourceid) {
          obj[key]._rev = '0-0';
          return;
        }
        return _util.updateRevInVersionedLink(obj[key])
        .then(function() {
          return rev_graph.addParentChildRelationship(link_id, resourceid, new_path_to_here); // track that this id has a versioned link at this path
        });
      });

    });
  },

  /////////////////////////////////////////////////////////////////////
  // Creating new resources:

  // newEmptyResource puts a new, empty resource (and it's meta document) into the database.
  newEmptyResource: function(resourceid, meta) {
    var meta_to_set;
    return Promise.try(function() {
      meta = meta || {};
      resourceid = '' + resourceid; // coerce to string
      if (!meta._mediaType) {
        throw new Error('memory-db-resources-driver.newEmptyResource: make this work with OADAError.'
                       +'  Cannot create new resource without mediaType.');
      }
      if (typeof resourceid !== 'string' && resourceid.length < 1) {
        throw new Error('memory-db-resources-driver.newEmptyResource: make this work with OADAError.'
                       +'  Cannot create a new resource with no valid resourceid given.');
      }

      meta_to_set = _.cloneDeep(meta);
      meta_to_set._metaid = resourceid;
      if (meta._id) delete meta._id;
      meta_to_set._rev = '1-' + db.uniqueId();
      return _util.setWrapper('/meta:'+resourceid, meta_to_set);
    }).then(function() {
      var res_to_set = {
        _id: resourceid,
        _rev: '1-' + db.uniqueId(),
        _meta: { _metaid: meta_to_set._metaid, _rev: meta_to_set._rev },
      };
      return _util.setWrapper('/'+resourceid, res_to_set);
    });
  },

  //////////////////////////////////////////////////////////////////////
  // Sanitizing and Validation

  // removes _id, _rev, and _metaid for any levels of the object that are
  // not obviously links
  sanitizeObjectForUpsert: function(obj) {
    if (typeof obj !== 'object') return;
    if (oada_util.isLink(obj)) return;
    if (obj._id) delete obj._id;
    if (obj._metaid) delete obj._metaid;
    if (obj._rev) delete obj._rev;
    for(var i in obj) {
      return _util.sanitizeObjectForUpsert(obj[i]);
    }
  },

};

module.exports = _MemoryDbResourcesDriver;

