var _ = require('lodash');
var pointer = require('json-pointer');
var Promise = require('bluebird');

var singleton = null;

module.exports = function(config) {
  if(singleton) return singleton;

  // Local libs:
  var oada_util = config.drivers.util();
  var db = config.drivers.db.db();
  
  // Circular dependency on rev_graph: wrap in function to delay until invocation of runtime functions
  var _rev_graph = null;
  var rev_graph = function() {
    if (!_rev_graph) _rev_graph = config.drivers.rev_graph();
    return _rev_graph;
  };
  
  // Logger:
  var log = config.drivers.log().child({ module: 'memory-db-resources-driver' });
  
  // What does a db driver do:
  // - handle following links if the db doesn't support it
  // - take care of creating new resources and linking _meta as needed
  // - merging top-level keys on PUT (i.e. set each one individually)
  // - exposes get/put/post/delete
  // - queues rev updates with rev-graph when a resource changes
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
    // opts.ignore_final_link: don't follow a link at the end of a path (only used for delete)
    get: function(path, opts) {
      return Promise.try(function() {
        opts = opts || {};
        if (path.charAt(0) !== '/') path = '/' + path; // leading slash is needed.
  
        var resid = pointer.parse(path)[0]; // resourceid is always first on path
  
        return db.get('resources', path, { type_and_length: opts.type_and_length } );
  
      }).then(function(info) {
        // If the last thing found on the path is a link, follow it whether that
        // was the end of the path or not.
        if (oada_util.isLink(info.val)) {
          var id = info.val._id;
          if (info.val._metaid) id = 'meta:'+info.val._metaid;
          var path_from_linked_resource = '/' + id + info.nonexistent_path;
          // Recursive call to try again with the linked resource:
          if (!(opts.ignore_final_link && info.nonexistent_path === '')) {
            return _MemoryDbResourcesDriver.get(path_from_linked_resource, opts);
          }
        }
  
        return info;
      });
    },
  
    // Path should start with the resource id you want to put to, not /resources.
    // Put will merge the top-level keys of the value you pass with the keys
    // of the thing at path.
    // If the thing you put to doesn't exist, it will create it.
    // If the thing you put to exists, it will only mess with the keys you give in the object
    // opts is optional unless your request will create a resource.  Then it must have
    // at least the _mediaType in it to store in _meta.
    // Returns: { _id: resourceid, path: final_path }
    put: function(path, topval, opts) {
      var final_path;
      var resourceid;
      var lock_release;
      return Promise.try(function() {
        opts = opts || {};
        if (path.charAt(0) !== '/') path = '/' + path; // leading slash is needed.
        if (path === '' || path === '/') {
          throw new Error('memory-db-resources-driver.put: Cannot PUT to /resources.');
        };
  
        // First, we need to get the correct path without any links.  Use get to follow all the links
        // that may show up in the path and find the final path to PUT against.
        return _MemoryDbResourcesDriver.get(path);
  
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
  
        topval = _.cloneDeep(topval);
        _util.sanitizeObjectForUpsert(topval, resourceid);
  
        return db.get('resources', final_path);
  
      }).then(function(info) {
        // If we didn't find it, decide if we're trying to create a resource or
        // just add new stuff to an existing resource:
        if (!info.found) {
          // We know that the top level of the path has to start with the resource.
          // Therefore if there are any 'existent' parts of the path, we're not
          // creating a resource so we can just set it and be done:
          if (info.existent_path !== '') {
            return _util.setWrapper(final_path, topval)
            .then(function() {
              return { _id: resourceid, path: final_path };
            });
          }
          // Now we know there is no existent_path: if there is no path listed at all, it must
          // have been a PUT to /resources.  Since that's tested for earlier, this shouldn't happen.
          if (info.nonexistent_path === '' || info.nonexistent_path === '/') {
            throw new Error('memory-db-resources-driver.put: Cannot PUT /resources.');
          }
          // At this point, there must be a nonexistent_path rooted at a non-existent
          // resource.  Create a new empty resource in the database, then set the path
          // we need on the new one.
          return _util.newEmptyResource(resourceid, opts._meta)
          .then(function() {
            return _MemoryDbResourcesDriver.put(final_path, topval, opts);
          });
        }
  
        // Otherwise we're changing an existing thing.  Object (merge) or other?
        return Promise.try(function() {
          if (typeof topval !== 'object') { // set it directly because it's a number, bool, or string
            return _util.setWrapper(final_path, topval);
          }
          // Otherwise it's an object. Loop through all it's keys and merge with existing in DB
          return Promise.map(_.keys(topval), function(key) {
            // can't set _id, _metaid, or _rev from outside:
            if (key === '_id' || key === '_metaid' || key === '_rev') return;
            return _util.setWrapper(final_path + '/' + key, topval[key], { skipQueueRevUpdate: true });
          }).then(function() {
            return _util.setWrapper(final_path, null, { skipSet: true });
          });
  
        }).then(function() {
          return {  _id: resourceid, path: final_path };
        });
  
      // Don't pop any .then's out at this level because sometimes you get the final link to return,
      // and other times you get the recursive result of calling this function for a new resource.
      });
    },
  
    // POST will 'append' to an object (new unique id) or array.  It returns:
    // Returns: {
    //   _id: resourceid_that_was_modified_or_created,
    //   path: path_that_was_created,
    //   key_created: the new ID that was made (last entry on path)
    // }
    post: function(path, val, opts) {
      var final_path;
      var resourceid;
      var new_id;
      var is_new_resource = false;
      return Promise.try(function() {
        opts = opts || {};
        if (path.charAt(0) !== '/') path = '/' + path; // leading slash is needed.
  
  
        // First, we need to get the correct path without any links.  Use get to follow all the links
        // that may show up in the path and find the final path to PUT against.
        return _MemoryDbResourcesDriver.get(path, { type_and_length: true });
  
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
        var parts = pointer.parse(final_path);
        if (parts.length === 0) { // creating a new resource
          resourceid = new_id;
        } else { // posting to existing resource: resourceid is first on path
          resourceid = parts[0];
        }
  
        // Note PUT will mark rev for updating through _util.setWrapper
        return _MemoryDbResourcesDriver.put(final_path, val, opts);
  
      }).then(function(info) {
        return {
          _id: resourceid,
          path: final_path,
          key_created: new_id,
        };
      });
    },
  
    // DELETE will remove the given path.  If the key does not exist,
    // it just doesn't do anything.  It won't delete '/', which would be all resources.
    // There are no opts as of yet.
    // Returns info = {
    //   _id: resourceid_changed,
    //   path: path removed, minus any links
    // }
    delete: function(path, opts) {
      var final_path;
      var resourceid;
      var found_info;
      return Promise.try(function() {
        opts = opts || {};
        if (path.charAt(0) !== '/') path = '/' + path; // leading slash is needed.
  
        if (path === '' || path === '/') { // POST /resources
          throw new Error('Cannot delete /resources');
        }
        resourceid = pointer.parse(path)[0]; // resourceid is always first on path
        // First, we need to get the correct path without any links.  Use get to follow all the links
        // that may show up in the path and find the final path to PUT against.
        return _MemoryDbResourcesDriver.get(path, { ignore_final_link: true });
  
      }).then(function(info) {
        // This path now has no links to follow in it:
        final_path = info.existent_path + info.nonexistent_path;
        resourceid = pointer.parse(path)[0];
        return db.remove('resources', final_path);
  
      }).then(function(info) {
        return { _id: resourceid, path: final_path };
  
      });
    },
  
    // directSet/directGet is used by the rev graph updater to update the _rev
    // on a versioned link.  Normal PUT would follow the link and try to set it
    // on the resource itself.  This is actually easy as long as we know the path
    // doesn't have any links in it, which it shouldn't since it's the rev_graph
    // calling it rather than the HTTP handlers.
    directSet: function(full_path_without_links, new_rev) {
      return db.set('resources', full_path_without_links, new_rev);
    },
  
    directGet: function(full_path_without_links) {
      return db.get('resources', full_path_without_links);
    },
  
    resourceidForPath: function(path) {
      path = path || '';
      if (!path.match(/^\//)) path = '/' + path; // leading slash
      try {
        var resid = pointer.parse(path)[0];
        if (resid === '') return null;
        return resid;
      } catch(err) {
        return null;
      }
    },
  
  };
  
  
  var _util = {
  
    // setWrapper assumes you've already aquired a write lock for the resource you're trying to
    // update.
    // opts.skipQueueRevUpdate: true|false
    // opts.skipSet: true|false // use to only queue the rev for updates
    setWrapper: function(path, val, opts) {
      var resourceid;
      opts = opts || {};
      return Promise.try(function() {
        resourceid = pointer.parse(path)[0]; // Do all the sanitizing outside of this function.
        // Update the content of the resource to fill in revisions for versioned links
        // and list this resource as a parent of each child.  Also adds parent/child relationships.
        if (opts.skipSet) return;
        return rev_graph().updateVersionedLinksInObj(val, resourceid, path)
  
      }).then(function(new_val) {
        if (opts.skipSet) return;
        return db.set('resources', path, new_val);
  
      }).then(function() {
        if (opts.skipQueueRevUpdate) return;
        return rev_graph().queueRevForUpdate(resourceid); // should be synchronous
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
        meta_to_set._rev = '0-0';
        return _util.setWrapper('/meta:'+resourceid, meta_to_set);
      }).then(function() {
        var res_to_set = {
          _id: resourceid,
          _rev: '0-0',
          _meta: { _metaid: meta_to_set._metaid, _rev: meta_to_set._rev },
        };
        return _util.setWrapper('/'+resourceid, res_to_set);
      });
    },
  
    //////////////////////////////////////////////////////////////////////
    // Sanitizing and Validation
  
    // removes _id, _rev, and _metaid for any levels of the object that are
    // not obviously links.  Synchronous, and it updates the obj in-place.
    sanitizeObjectForUpsert: function(obj, resourceid) {
      if (typeof obj !== 'object') return;
      if (oada_util.isLink(obj)) return;
      if (obj._id) delete obj._id;
      if (obj._metaid) delete obj._metaid;
      if (obj._rev) delete obj._rev;
      if (obj._meta) {
        var actual_resourceid = resourceid.replace(/^meta:/,'');
        if (!oada_util.isMetaLink(obj._meta)) {
          obj._meta = { _metaid: actual_resourceid, _rev: '0-0' };
        }
        if (obj._meta._metaid !== actual_resourceid) {
          obj._meta._metaid = actual_resourceid;
        }
      }
      for(var i in obj) {
        return _util.sanitizeObjectForUpsert(obj[i], resourceid);
      }
    },
  
  };
  
  singleton = _MemoryDbResourcesDriver;
  return singleton;
};  
