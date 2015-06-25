// This is a module to run a separate 'thread' which handles updating the
// _rev graph based on queue'd up paths/resourceids.  

var pointer = require('json-pointer');
var db = require('./memory-db.js');
var fifo = require('fifo');
var Promise = require('bluebird');
var uuid = require('uuid');
var rwlock = require('./rwlock-promise.js');
var _ = require('lodash');

var config = {
  timeout_on_empty: 100, // ms
  timeout_on_notempty: 0, // ms (0 == next event loop)
};


var resource_index = {};
var queue = fifo();

// These locks are specific to this module and do not know anything about the resource
// locks in memory-db-resources-driver.js.
var parents_locks = new rwlock();

var _RevGraph = {

  incrementRevString: function(rev) {
    if (!rev) rev = '0-0';
    var rev_seq = rev.split('-')[0];
    // the '+rev_seq' coerces rev_seq to an int
    return (+rev_seq + 1) + '-' + uuid.v4().replace(/-/g,'');
  },

  queueUpdateParents: function(resourceid, new_rev, parents_already_seen) {
    parents_already_seen = parents_already_seen || {};
    if (_.has(parents_already_seen, resourceid)) {
      return; // no need to update this resource again because it's already been seen once
    };
    // Now we've seen this one
    parents_already_seen[resourceid] = true;
    // The queue has two components: a fifo queue telling what order to service
    // resources, and a map that holds the latest known rev to update with.
    // In order to allow multiple updates to chain together in a slow-moving queue,
    // the map only stores the latest/maximum revision it has seen.
    var cur_scheduled_update_rev = resource_index[resourceid];
    if (cur_scheduled_update_rev) {
      var cur_seq = cur_scheduled_update_rev.split('-')[0];
      var new_seq = new_rev.split('-')[0];
      if (+new_seq <= +cur_seq) return; // the +'s coerce to numbers
    }
    resource_index[resourceid] = new_rev;
    queue.push({ resourceid: resourceid, parents_already_seen: parents_already_seen });
  },

  addParentChildRelationship: function(childid, parentid, full_path_to_child) {
    var lock_release;
    var parent_paths;
    var new_id;
    return Promise.try(function() {
      new_id = db.uniqueId();
    }).then(function() {
      return parents_locks.writeLock(childid) // parents has 'parents of this childid' in it
    }).then(function(release) {
      lock_release = release;

      return db.set('parents', '/'+childid+'/'+parentid+'/'+new_id, full_path_to_child);
    }).finally(function() {
      if (lock_release) lock_release();
    });
  },

  removeParentChildRelationship: function(childid, parentid, id_of_path) {
    var lock_release;
    return parents_locks.writeLock(childid)
    .then(function(release) {
      lock_release = release;
      return db.remove('parents', '/'+childid+'/'+parentid+'/'+id_of_path);
    }).finally(function() {
      if (lock_release) lock_release();
    });
  },

  start: function() {
    var lock_release;
    return Promise.try(function() {
      if (queue.isEmpty()) return setTimeout(_RevGraph.start, config.timeout_on_empty);

      // 1. pull next updated child resource from fifo queue and it's rev from the resource_index:
      var child_info = queue.shift();
      var childid = child_info.resourceid;
      var parents_already_seen = child_info.parents_already_seen;

      var new_rev = resource_index[childid];
      if (!new_rev) {
        // somebody already updated things for this child and the fifo is just now
        // getting around to a later call.  No need to update things yet again.
        return;
      }
      // Remove the resource_index for future things that might pop out of the queue
      // to update the same thing we're updating now:
      delete resource_index[childid];


      // 2. get list of all parent resources that link to that child resource
      return parents_locks.readLock(childid)
      .then(function(release) {
        lock_release = release;
        return db.get('parents', '/'+childid)
  
      }).then(function(info) {
        lock_release(); lock_release = null;
        if (!info.found) return; // no entry for this childid?
        // 3. in parallel, get the list of paths at each parent which need the new child _rev
        return Promise.map(info.val, function(list_of_paths, parentid) {
          parents_already_seen[parentid] = true;
          // 4. send that list with the new _rev to 'updateVersionedLinkSet' in memorydb-resources-driver
          return driver.updateVersionedLinkList(list_of_paths, parentid, childid, new_rev, parents_already_seen);
        }).then(function() {
          // done!  Reschedule ourselves to run again:
          setTimeout(_RevGraph.start, timeout_on_notempty);
        });
      }).finally(function() {
        if (lock_release) lock_release();
      });
    });
  },


};

module.exports = _RevGraph;
