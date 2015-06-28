// This is a module to run a separate 'thread' which handles updating the
// _rev graph based on queue'd up paths/resourceids.  

var pointer = require('json-pointer');
var db = require('./memory-db.js');
var fifo = require('fifo');
var Promise = require('bluebird');
var uuid = require('uuid');
var _ = require('lodash');
require('extend-error'); // adds .extend to Error class

var oada_util = require('./oada-util.js');

var config = {
  timeout_on_empty: 100, // ms
  timeout_on_notempty: 0, // ms (0 == next event loop)
};


var _errors = { 
    ResourceRemoved: Error.extend('ResourceRemoved'),
  RevAlreadyUpdated: Error.extend('RevAlreadyUpdated'),
         QueueEmpty: Error.extend('QueueEmpty'),
};


var resource_index = {};
var queue = fifo();

var _RevGraph = {

  incrementRevString: function(rev) {
    if (!rev || !rev.match(/^.+-.+$/)) rev = '0-0';
    var rev_seq = rev.split('-')[0];
    // the '+rev_seq' coerces rev_seq to an int
    return (+rev_seq + 1) + '-' + uuid.v4().replace(/-/g,'');
  },

  // parentsAlreadySeen is to prevent circular loops.  It's only set when used by
  // the rev-graph update loop.  You should leave it blank if you call it from outside.
  queueRevForUpdate: function(resourceid, parents_already_seen) {
    parents_already_seen = parents_already_seen || {};
    if (_.has(parents_already_seen, resourceid)) {
      return; // no need to update this resource again because it's already been seen once
    };
    // Now we've seen this one
    parents_already_seen[resourceid] = true;
    // The queue has two components: a fifo queue telling what order to service
    // resources, and a map that holds a boolean 'true' if a resource's _rev should be
    // updated.  The boolean is used to 'batch' together _rev updates: i.e. if a resourceid
    // is in the queue multiple times, it will be in the map only once, and later runs
    // of the update loop will just ignore the resource in the fifo queue.
    resource_index[resourceid] = true;
    queue.push({ _id: resourceid, parents_already_seen: parents_already_seen });
  },

  // When a child is updated, this list keeps track of where the links which point 
  // to it need to be updated.
  addChildParentRelationship: function(childid, parentid, full_path_to_child) {
    var parent_paths;
    var new_id;
    return Promise.try(function() {
      new_id = db.uniqueId();
      return db.set('children', '/'+childid+'/'+parentid+'/'+new_id, full_path_to_child);
    });
  },

  removeChildParentRelationship: function(childid, parentid, id_of_path_to_remove) {
    return db.remove('children', '/'+childid+'/'+parentid+'/'+id_of_path_to_remove);
  },

  removeChild: function(childid) {
    return db.remove('children', '/'+childid);
  },

  updateRevInVersionedLink: function(link, container_resourceid, path_to_link) {
    var link_id = link._id || ('meta:' + link._metaid);
    var link_rev;
    var CircularLink = Error.extend('CircularLink');

    return Promise.try(function() {
      if (link_id === container_resourceid) {
        throw CircularLink();
      }

    }).then(function() {
      return db.get('resources', '/' + link_id + '/_rev')

    }).then(function(info) {;
      link_rev = info.val;
      if (!info.found) link_rev = '0-0'; // link does not exist
      return _RevGraph.addChildParentRelationship(link_id, container_resourceid, path_to_link);

    }).then(function() {
      var ret = { _id: link_id, _rev: link_rev };
      if (link._metaid) {
        ret._metaid = link._metaid;
        delete ret._id;
      }
      return ret; // returns new link with updated _rev

    // Force circular link _rev to '0-0'
    }).catch(CircularLink, function(err) {
      var ret = { _id: link_id, _rev: '0-0' };
      if (link._metaid) {
        ret._metaid = link._metaid;
        delete ret._id;
      }
      return ret;
    });
  },

  // Walk through an entire in-memory object and update the link versions anywhere
  // a link is found.
  updateVersionedLinksInObj: function(obj, resourceid, path_to_here) {
    return Promise.try(function() {
      if (typeof obj !== 'object') return obj;

      if (oada_util.isVersionedLink(obj)) {
        return _RevGraph.updateRevInVersionedLink(obj);
      }

      // Otherwise it's an object we need to check all the keys for links:
      var new_obj = {};
      return Promise.map(_.keys(obj), function(key) {
        var new_path_to_here = path_to_here + '/' + key;
        return _RevGraph.updateVersionedLinksInObj(obj[key], resourceid, new_path_to_here)
        .then(function(updated) {
          new_obj[key] = updated;
        });
      }).then(function() {
        return new_obj;
      });
    });
  },


  // Start the rev_graph queue watcher on a different 'thread' of execution
  start: function() {
    var new_rev;
    return Promise.try(function() {
      if (queue.isEmpty()) {
        throw _errors.QueueEmpty();
      }

      // 1. pull next updated child resource from fifo queue and check resource_index map
      var child_info = queue.shift();
      var childid = child_info._id;
      var parents_already_seen = child_info.parents_already_seen;
      
      // If an earlier loop already updated this _rev, skip it
      if (!resource_index[childid]) { throw _errors.RevAlreadyUpdated(); }

      // Remove the resource_index until a future change sets it again:
      delete resource_index[childid];

      // 2. get the old rev on the resource, increment it, and put it back:
      return driver.get('/'+childid+'/_rev');

    }).then(function(info) {
      if (!info.found) { // the resource no longer exists
        return db.removeChild(childid)
        .then(function() {
          throw _errors.ResourceRemoved();
        });
      }
      // Increment the rev:
      new_rev = _RevGraph.incrementRevString(info.val);
      // Set it back:
      return driver.directSet('/'+childid+'/_rev', new_rev);

    }).then(function() {
      // 3. Get list of all parent resources that link to this child resource
      return db.get('children', '/'+childid)
  
    }).then(function(info) {
      if (!info.found) return; // no entry for this childid?

      // 4. In parallel, get the list of paths at each parent which need the new child _rev
      return Promise.map(info.val, function(list_of_paths_at_parent, parentid) {
        parents_already_seen[parentid] = true;

        // For each path, get and update the _rev in the link.  Note the race condition here that if 
        // someone updates the link between the time we read it and the time we write it, we will 
        // overwrite the _rev of the change, or the request could fail if they replace it with a 
        // non-object, or we could write the rev of this resource on a link that has been changed to
        // link to a different resource.  Or, I think we have issues if the underlying data store
        // returns a stale _rev.
        return Promise.map(list_of_paths_at_parent, function(path, pathid) {
          return driver.directGet(path)

          .then(function(info) {
            var id;
            if (info.val) { 
              id = info.val._id || ('meta:' + info.val._metaid); 
            }
            if (!info.found || !oada_util.isVersionedLink(info.val) || id !== childid) {
              return _RevGraph.removeChildParentRelationship(childid, parentid, pathid);
            }
            return driver.directSet(path + '/_rev', new_rev);
          });

        // Done with all paths at a given parent, queue it for a rev update:
        }).then(function() {
          return _RevGraph.queueRevForUpdate(parentid, parents_already_seen);
        });
      
      // Done with all parents
      });

    }).catch(_errors.ResourceRemoved, function(err) {
      // No need to do anything in this case.
    }).catch(_errors.RevAlreadyUpdated, function(err) {
      // No need to do anything here either.
    }).catch(_errors.QueueEmpty, function(err) {
      // No need to do anything here either.

    // No matter what, schedule ourselves to run again:
    }).finally(function() {
      if (queue.isEmpty()) {
        return setTimeout(_RevGraph.start, config.timeout_on_empty);
      }
      setTimeout(_RevGraph.start, config.timeout_on_notempty);
    });
  },

};

module.exports = _RevGraph;
