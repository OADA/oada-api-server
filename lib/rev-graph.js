// This is a module to run a separate 'thread' which handles updating the
// _rev graph based on queue'd up paths/resourceids.  

var pointer = require('json-pointer');
var fifo = require('fifo');
var Promise = require('bluebird-extra');
var uuid = require('uuid');
var _ = require('lodash');
var pointer = require('json-pointer');
require('extend-error'); // adds .extend to Error class


var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var db = config.libs.db.db();
  var oada_util = config.libs.util();
  
  var _driver = null;
  var driver = function() {
    // Circular dependency: require driver later by wrapping in function
    // to delay invocation until after all require()'s have finished
    if (!_driver) _driver = config.libs.db.resources();
    return _driver;
  };
  
  var local_config = {
    timeout_on_empty: 100, // ms
    timeout_on_notempty: 0, // ms (0 == next event loop)
  };
  
  
  var _errors = { 
      ResourceRemoved: Error.extend('ResourceRemoved'),
    RevAlreadyUpdated: Error.extend('RevAlreadyUpdated'),
           QueueEmpty: Error.extend('QueueEmpty'),
        ParamsMissing: Error.extend('ParamsMissing'),
      NoEntryForChild: Error.extend('NoParentsEntry'),
  };
  
  
  var resource_index = {};
  var queue = fifo();
  
  var _RevGraph = {
  
    // Walk through an entire in-memory object and update the link versions anywhere
    // a link is found.
    updateVersionedLinksInObj: function(obj, resourceid, path_to_here) {
      return Promise.try(function() {
        if (!resourceid || !path_to_here) {
          throw _errors.ParamsMissing();
        }
  
        if (typeof obj !== 'object') return obj;
  
        if (oada_util.isVersionedLink(obj)) {
          return _RevGraph.updateRevInVersionedLink(obj, resourceid, path_to_here);
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
  
    updateRevInVersionedLink: function(link, container_resourceid, path_to_link) {
      var link_id = link._id || ('meta:' + link._metaid);
      var link_rev;
      var CircularLink = Error.extend('CircularLink');
      var NotVersionedLink = Error.extend('NotVersionedLink');
  
      return Promise.try(function() {
        if (!link || !container_resourceid || !path_to_link) {
          throw _errors.ParamsMissing();
        }
  
        if (link_id === container_resourceid) {
          throw CircularLink();
        }
        if (!oada_util.isVersionedLink(link)) {
          throw NotVersionedLink();
        }
  
      }).then(function() {
        return driver().directGet('resources', '/' + link_id + '/_rev');
  
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
      }).catch(NotVersionedLink, function(err) {
        return link; // just leave it alone.
      });
    },
  
    incrementRevString: function(rev) {
      if (!rev || !rev.match(/^.+-.+$/)) rev = '0-0';
      var rev_seq = rev.split('-')[0];
      // the '+rev_seq' coerces rev_seq to an int
      return (+rev_seq + 1) + '-' + uuid.v4().replace(/-/g,'');
    },
  
    // When a child is updated, this list keeps track of where the links which point 
    // to it need to be updated.  Just give it a full path to the child, including the
    // resourceid :
    addChildParentRelationship: function(childid, parentid, full_path_to_link_in_parent_with_resourceid) {
      var parent_paths;
      var new_id;
      return Promise.try(function() {
        var escaped_path = pointer.escape(full_path_to_link_in_parent_with_resourceid);
        // Set /123/456/the~1path = true
        return db.set('children', '/'+childid+'/'+parentid+'/'+escaped_path, true);
      });
    },
  
    removeChildParentRelationship: function(childid, parentid, full_path_to_link_in_parent_with_resourceid) {
      return Promise.try(function() {
        var escaped_path = pointer.escape(full_path_to_link_in_parent_with_resourceid);
        // Set /123/456/the~1path = true
        return db.remove('children', '/'+childid+'/'+parentid+'/'+escaped_path);
      });
    },
  
    removeChild: function(childid) {
      return db.remove('children', '/'+childid);
    },
  
    // these 'has*' functions are only used by the tests
    childHasRelationships: function(childid) {
      return db.get('children', '/'+childid)
      .then(function(info) {
        return info.found;
      });
    },
  
    childHasParentRelationship: function(childid, parentid, full_path_to_link_in_parent_with_resourceid) {
      return Promise.try(function() {
        var escaped_path = pointer.escape(full_path_to_link_in_parent_with_resourceid);
        return db.get('children', '/'+childid+'/'+parentid+'/'+escaped_path)
        .then(function(info) {
          return (info.found && (info.val === true));
        });
      });
    },
  
    // used only by the test script:
    reset: function() {
      return db.clean('children')
      .then(function() {
        queue.removeAll();
        resource_index = {};
      });
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
  
    // handleQueue updates 1 _rev that is scheduled for update in the queue. 
    // Returns { path: '/path/to/updated/thing' } to indicate whether it found something in the
    // queue or not.
    handleQueue: function() {
      var new_rev;
      var childid;
      var child_info;
      var parents_already_seen;
  
      return Promise.try(function() {
        if (queue.isEmpty()) {
          throw _errors.QueueEmpty();
        }
  
        // 1. pull next updated child resource from fifo queue and check resource_index map
        child_info = queue.shift();
        childid = child_info._id;
        parents_already_seen = child_info.parents_already_seen;
        // If an earlier loop already updated this _rev (i.e. removed it's 
        // boolean 'true' from the resource_index), skip it
        if (!resource_index[childid]) { throw _errors.RevAlreadyUpdated(); }
  
        // Remove the resource_index until a future change sets it again:
        delete resource_index[childid];
  
        // 2. get the old rev on the resource, increment it, and put it back:
        return driver().get('/'+childid+'/_rev');
  
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
        return driver().directSet('/'+childid+'/_rev', new_rev);
  
      }).then(function() {
        // 3. Get list of all parent resources that link to this child resource
        return db.get('children', '/'+childid)
    
      }).then(function(info) {
        if (!info.found) {
          throw _errors.NoEntryForChild({ childid: childid }); // no entry for this childid?
        }
  
        // 4. In parallel, get the list of paths at each parent which need the new child _rev
        return Promise.own(info.val, function(list_of_paths_at_parent, parentid) {
          parents_already_seen[parentid] = true;
  
          // For each path, get and update the _rev in the link.  Note the race condition here that if 
          // someone updates the link between the time we read it and the time we write it, we will 
          // overwrite the _rev of the change, or the request could fail if they replace it with a 
          // non-object, or we could write the rev of this resource on a link that has been changed to
          // link to a different resource.  Or, I think we have issues if the underlying data store
          // returns a stale _rev.
          return Promise.own(list_of_paths_at_parent, function(val, escaped_path) {
            var path = pointer.unescape(escaped_path);
            return driver().directGet(path)
  
            .then(function(info) {
              var id;
              if (info.val) { 
                id = info.val._id || ('meta:' + info.val._metaid); 
              }
              if (!info.found || !oada_util.isVersionedLink(info.val) || id !== childid) {
                return _RevGraph.removeChildParentRelationship(childid, parentid, path);
              }
              return driver().directSet(path + '/_rev', new_rev);
            });
  
          // Done with all paths at a given parent, queue it for a rev update:
          }).then(function() {
            return _RevGraph.queueRevForUpdate(parentid, parents_already_seen);
          });
        
        // Done with all parents
        }).then(function() {
        });
  
      }).catch(_errors.ResourceRemoved, function(err) {
        // No need to do anything in this case.
      }).catch(_errors.RevAlreadyUpdated, function(err) {
        // No need to do anything here either.
      }).catch(_errors.QueueEmpty, function(err) {
        // No need to do anything here either.
      }).catch(_errors.NoEntryForChild, function(err) {
        // No need to do anything here either.
      });
  
    },
  
    is_stopped: true,
    timer: null,
    // Start the rev_graph queue watcher on a different 'thread' of execution
    start: function() {
      _RevGraph.is_stopped = false;
      // By not returning the promise, execution continues back in the caller
      _RevGraph.handleQueue()
      .finally(function() {
        if (_RevGraph.is_stopped) return; // don't reschedule
        if (queue.isEmpty()) {
          _RevGraph.timer = setTimeout(_RevGraph.start, local_config.timeout_on_empty);
        } else {
          _RevGraph.timer = setTimeout(_RevGraph.start, local_config.timeout_on_notempty);
        }
      });
    },
  
    stop: function() {
      _RevGraph.is_stopped = true;
      if (_RevGraph.timer) clearTimeout(_RevGraph.timer);
      _RevGraph.timer = null;
    },
  
  };
 
  singleton = _RevGraph;
  return singleton;
};
