var _ = require('lodash');
var uuid = require('uuid');
var md5 = require('md5');

// Local libs:
var oada_util = require.main.require('./lib/oada-util.js');

// Logger:
var log = require.main.require('./lib/logger.js').child({ module: 'memory-db' });

var db = {
  resources_map: {},
  parents_map: {},
  children_map: {},
  tokens_map: {},
  etags: {},
};

var _MemoryDb = {

  /////////////////////////////////////////////////////////
  // Get/Set to interact with resources in DB
  /////////////////////////////////////////////////////////

  // Given a link object, return a copy of the resource it points to
  // Note that you can only get top-level resources here.  To get a sub-document
  // based on a path, use getByPath.
  get: function(link) {
    if (!oada_util.isLink(link)) return null;
    link = oada_util.metaToId(link);
    return _.cloneDeep(_.get(db.resources_map, link._id, null));
  },
  // Wrappers for "get" that build the link object from the id:
  getResource: function(_id) {
    return _MemoryDb.get({ _id: _id });
  },
  getMeta: function(_metaid) {
    return _MemoryDb.get({ _metaid: _metaid });
  },
  set: function(obj) {
    if (!oada_util.isLink(obj)) return false;
    obj = oada_util.metaToId(obj);
    var id = obj._id;
    obj = _.cloneDeep(obj);
    obj = oada_util.idToMeta(obj); // move _id to _metaid if necessary
    db.resources_map[id] = obj;
    _MemoryDb.triggerUpdatedEvent({ _id: id });
    return true;
  },

  // Given a path (string or array) starting with a resourceid, walk through the path
  // and find the last object in it, then return the path starting that the last object's
  // resourceid.  Note if the value of the last thing in the path is a link, it will
  // not follow the final link since the path requested was for the link itself, unless
  // you pass that option.
  // options = {
  //   return_supporting_info: true|false*,
  //   return_path_as_array: true|false*,     // returns ['a','b','c'] vs. "a/b/c"
  //   follow_until_nonexistent: true|false*, // used for setting things that don't exist yet.
  //   follow_last_link: true|false,
  // }
  // ( * = default)
  pathWithoutLinks: function(path, options) {
    options = options || {};
    if (typeof path === 'string') {
      path = path.replace(/\/$/,'').split('/'); // remove trailing slashes, turn into array
    }
    log.debug('pathWithoutLinks: path = ', path);
    // First one is a resourceid
    var resource = _.get(db.resources_map, path[0], null);
    var cur_obj = db.resources_map;

    // If there's anything left after the resource id, follow it, looking for links
    var stopped_at = path.length;
    for (var i in path) {
      var cur_key = path[i];
      cur_obj = _.get(cur_obj, cur_key, null);

      // If this isn't the resource itself, and it's not the top-level resource,
      // and it's not the last thing in the path, is it a link?  Note that we
      // don't follow a link at the end of the path because the path is actually
      // to the link itself (except for POST, which handles this specially).
      // If so, recursion to get path from this new resource.
      if (i > 0 && i < path.length-1 && oada_util.isLink(cur_obj)) {
        path[i] = oada_util.metaToId(cur_obj)._id;
        log.debug('pathWithoutLinks: recursion with path ', path, ' for obj ', cur_obj);
        return _MemoryDb.pathWithoutLinks(path.slice(i), options);
      }

      // Found part of the path which doesn't exist.
      if (!cur_obj) {
        stopped_at = i;
        break;
      }
      // Otherwise, this key is just part of the resource, go see if there's another
    }

    if (!cur_obj) {
      // Reached a part of the path that doesn't exist: does caller want this to be an error?
      if (!options.follow_until_nonexistent) return null;
    }

    // Otherwise, caller wants the rest of the path back:
    var existent_path = path.slice(0,stopped_at);  // [0,i)
    var nonexistent_path = path.slice(stopped_at); //   [i,length)
    var path_after_resource = path.slice(1);       // removes first item

    // If this is a link (not a top-level resource), see if they want to follow it
    if (oada_util.isLink(cur_obj) && path_after_resource.length > 0) {
      if (options.follow_last_link) {
        cur_obj = oada_util.metaToId(cur_obj);
        // Rather than repeat all the 'options' logic about what to return, just 
        // recurse with only this link's _id and the same options.
        return _MemoryDb.pathWithoutLinks(cur_obj._id,options);
      }
    }

    if (!options.return_path_as_array) {
      path = path.join('/');
      nonexistent_path = nonexistent_path.join('/');
      existent_path = existent_path.join('/');
      path_after_resource = path_after_resource.join('/');
    }
    if (!options.return_supporting_info) {
      return path; // return full path including resource
    }
    return {
      path: path,
      link_to_resource: oada_util.link(resource),
      path_after_resource: path_after_resource,
      existent_path: existent_path,       // may be an empty array
      nonexistent_path: nonexistent_path, // may be an empty array
    };
  },

  // getByPath will get a copy of whatever object sits at the end of a given path.
  // Note the path MUST start with a resourceid: i.e. you can't getByPath('/resources')
  // options = {
  //   type_and_length: true|false*, // returns typeof the value rather (and length if array) than a copy of it
  //   include_supporting_info: true|false*
  //   follow_last_link: true|false*
  // }
  getByPath: function(path, options) {
    options = options || {};
    options.follow_last_link = options.follow_last_link || false;

    var res_info = _MemoryDb.pathWithoutLinks(path, { 
      return_supporting_info: true, return_path_as_array: true, follow_last_link: options.follow_last_link,
    });
    log.debug('getByPath: after pathWithoutLinks(',path,'), res_info = ', res_info);
    if (!oada_util.isLink(res_info.link_to_resource)) return null; // Not found!

    var resource = _.get(db.resources_map, res_info.link_to_resource._id, null);
    var found_obj;
    if (res_info.path_after_resource.length > 0) {
      found_obj = _.get(resource, res_info.path_after_resource, null);
    } else {
      found_obj = resource;
    }

    log.debug('getByPath: link(resource) = ', oada_util.link(resource));
    log.debug('getByPath: link(found_obj) = ', oada_util.link(found_obj));
    if (options.type_and_length) {
      if (_.isArray(found_obj)) {
        return { type: 'array', length: found_obj.length };
      }
      return { type: (typeof found_obj) };
    }
    if (!options.include_supporting_info) return _.cloneDeep(found_obj);
    return {
      value: _.cloneDeep(found_obj),
      link_to_resource: oada_util.versionedLink(resource),
    };
  },

  // Note: skip_triggerUpdatedEvent should ONLY be used by the updateParentRevs
  // function.
  // options = {
  //   skip_triggerUpdateEvent: true|false*
  //   _mediaType: "application/whatever" -- use if setting a new resource from a PUT
  // }
  // ( * = default )
  setByPath: function(path, new_val, options) {
    options = options || {};
    log.trace('setByPath: path = ', path);

    // Walk down the path and get to the end of any links:
    var resinfo = _MemoryDb.pathWithoutLinks(path, {
      return_supporting_info: true, return_path_as_array: true, follow_until_nonexistent: true,
    });

    // Get the parent resource that will contain this new value:
    var resid = _.get(resinfo, 'link_to_resource._id', null);
    var parent_resource = _.get(db.resources_map, resid, null);

    // Figure out if they are setting a top-level resource:
    if (!parent_resource || resinfo.path_after_resource.length === 0) {
      new_val._id = resinfo.path[0];

      // Make sure it has _meta and _rev
      if (!oada_util.isMetaLink(new_val._meta)) {
        var new_meta = _MemoryDb.newMeta(new_val, { _mediaType: options._mediaType });
        new_val._meta = oada_util.versionedLink(new_meta);
        log.debug('setByPath: new_val._meta = ', new_val._meta);
      }
      if (!_.has(new_val, '_rev')) {
        new_val._rev = '0-0';
      }
      parent_resource = db.resources_map;
      // Since the "resource" will be the resources_map itself, need
      // to put the resourceid back onto the front of path_after_resource:
      resinfo.path_after_resource = resinfo.path;
      resid = resinfo.path[0]; // It will create this particular resourceid
    }

    // Create the requested path within the parent object if it doesn't exist, 
    // and store a copy of the val there.
    _.set(parent_resource, resinfo.path_after_resource, _.cloneDeep(new_val));

    // Update the _rev
    if (!options.skip_triggerUpdatedEvent) {
      _MemoryDb.triggerUpdatedEvent({ _id: resid });
    }
    var result = {
      _id: resid,
      _rev: db.resources_map[resid]._rev
    };
    return result;
  },

  // Returns an up-to-date versioned link for an object.
  getCurrentVersionedLink: function(obj) {
    var id = oada_util.metaToId(obj);
    return oada_util.versionedLink({ _id: id, _rev: db.resources_map[id]._rev});
  },


  ///////////////////////////////////////////////////////////////////
  // Creation of things
  ///////////////////////////////////////////////////////////////////

  uniqueId: function() {
    var id = uuid.v4().replace(/-/g,'');
    log.debug('uniqueId: new id is ', id);
    return id;
  },

  // Creates a new resource from the given object and meta.  Fills in 
  // _rev and creates a new id for it.
  newResource: function(obj, metaobj) {
    obj = obj || {};
    obj._id = _MemoryDb.uniqueId();

    // Create new meta doc and populate the _meta link in the resource
    var new_meta = _MemoryDb.newMeta(obj, metaobj);
    obj._meta = oada_util.versionedLink(new_meta);

    // Store the new document in the resource map in memory
    // (Note: this will create the _rev on the resource):
    log.debug('newResource: saving obj', obj);
    _MemoryDb.set(obj);

    // Send the object back so they can get the _id:
    return _MemoryDb.get(obj);
  },
  
  // You can pass in an object containing key/value pairs that you want to be
  // in the final meta document, and _metaid/_rev will be added to them.
  newMeta: function(resource, metaobj) {
    metaobj = metaobj || {};

    metaobj._metaid = resource._id; // same metaid as main object
    metaobj = oada_util.metaToId(metaobj);
    // Copy into /meta (this will create/update the _rev):
    log.debug('newMeta: setting metaobj as ', metaobj);
    _MemoryDb.set(metaobj);

    // Return a copy of the new object so they can get the id:
    return _MemoryDb.get(metaobj);
  },


  ////////////////////////////////////////////////////////////////
  // _rev handling
  ////////////////////////////////////////////////////////////////

  // This should be called whenever a resource is updated.  It will
  // update the resource's _rev, and update any parents.  Eventually
  // this should be replaced with Baobab to just listen for changes
  // on the object.  ONLY use the resources_already_seen for the
  // updateParentRevs function.
  triggerUpdatedEvent: function(obj, skip_updateParentRevs) {
    // Update the rev on this thing in the memory map (uses obj._id or obj._metaid)
    _MemoryDb.updateRev(obj);

    // Find anything that this document links to and go add ourselves to it's list of parents.
    // Also, if we were previously in a list of another resource's parents, and we no longer link
    // to that resource, remove ourselves from their list.
    _MemoryDb.removeStaleChildLinks(obj);
    _MemoryDb.recordNewChildLinks(obj);

    // This updateParentLinks function should trigger each new _rev to change
    // on all the resources that link to this one.  Has to handle circular
    // loops properly: once a repeated resource is detected, update the link
    // in that resource, but don't update it's _rev.
    if (!skip_updateParentRevs) {
      _MemoryDb.updateParentRevs(obj);
    }
  },

  // updateRev will increment the _rev for obj._id in the 
  // resources_map.  It only uses _id on obj, so you can also pass
  // in a link to an object.
  updateRev: function(obj) {
    log.debug('updateRev: obj = ', obj);
    var id = oada_util.metaToId(obj)._id;

    if (!_.has(db.resources_map, id)) {
      log.error('updateRev: Requested update of _rev for non-existent resource ('+id+')');
      return;
    }
    var rev = db.resources_map[id]._rev || '0-0';
    var rev_seq = rev.split('-')[0];
    rev_seq = +rev_seq; // coerce to int
    rev_seq += 1;
    // Note the object still has the old _rev on it when it gets hashed here.
    db.resources_map[id]._rev = rev_seq + '-' + md5(JSON.stringify(db.resources_map[id]));
    return db.resources_map[id]._rev;
  },

  // Returns a collection of the immediate child links present in the given object.
  computeChildren: function(obj, path) {
    var id = obj._id || ("meta:"+obj._id);
    path = path || "/resources/"+id;
    return _.reduce(obj, function(result, val, key) {
      // If we find a link, we're done on this path.  Record in list of children if versioned.
      if (oada_util.isVersionedLink(val)) {
        var id = val._id || ("meta:"+val._metaid);
        result[id] = result[id] || {
          link: oada_util.link(val),
          paths_to_links_in_parent: []
        };
        // The same link may exist multiple times in this resource,
        // so keep an array of all the paths within the document to this
        // same link.
        result[id].paths_to_links_in_parent.push(path);

        return result;
      }
      // If link is not versioned, ignore it.
      if (oada_util.isLink(val)) return result;

      // If this value is an object/array itself, recursively loop through 
      // it's keys, too.
      if (_.isObject(val)) {
        return _.merge(result, _MemoryDb.computeChildren(val, path+"/"+key));
      }

      // Not a link, not an object: number, string, bool: don't care
      return result;
    }, {});
  },


  // obj must be either a resource or a meta document.  This function will
  // get the previous list of all documents that we linked to before the latest change, 
  // find any that are no longer linked to, and remove it from their list of parents.
  removeStaleChildLinks: function(obj) {
    var id = obj._id || ("meta:" + obj._metaid);
    var old_children = _.get(db.children_map, id);
    var new_children = _MemoryDb.computeChildren(obj);
    _.each(old_children, function(val,child_id) {
      if (!_.has(new_children, child_id)) {
        // Found an old child_id that doesn't exist in the new list of children.
        // Delete ourselves from this old child_id's parent list: parents_map[child_id][id].
        if (_.has(parents_map, [child_id, id])) {
          delete parents_map[child_id][id];
        }
      }
      // Otherwise, this one still exists in that list so leave it alone
    });
  },

  // recordNewChildLinks updates the list of child links for this document,
  // and also goes to each of the child links and adds us to their list of parents
  recordNewChildLinks: function(obj) {
    var id = obj._id || ("meta:" + obj._metaid);
    db.children_map[id] = _MemoryDb.computeChildren(obj);
  },

  // Need resources_already_seen to handle circular loops.  Whenever you
  // reach a resource that has already been seen, update it's link but not
  // it's overall _rev, because the change that started this process has 
  // already been reflected.
  updateParentRevs: function(obj, resources_already_seen) {
    var id = obj._id || ("meta:"+obj._metaid);

    // Check if we've seen this resource already in this changeset.
    // If so, don't update it's _rev again.
    var resources_already_seen = resources_already_seen || {};
    if (_.has(resources_already_seen, id)) return;
    resources_already_seen[id] = true;

    if (!_.has(db.parents_map, id)) return; // No parents for this resource!

    // Loop through each parent for this doc and update it's versioned link
    // to us, which will in turn trigger a subsequent call to updateParentRevs
    _.each(parents_map[id], function(parent_info) {
      // We want to manually trigger the parent updates after updating the link
      // so that we can pass the resources_already_seen in the recursion to updateParentRevs
      _.each(parent_info.paths_to_links_in_parent, function(path) {
        _MemoryDb.setByPath(
          parent_info.path_to_link_in_parent, 
          oada_util.versionedLink(_MemoryDb.get(parent_info.link)),
          "skip_triggerUpdatedEvent"
        );
      });
      _MemoryDb.triggerUpdatedEvent(oada_util.link(id), "skip_updateParentRevs");
      _MemoryDb.updateParentRevs(oada_util.link(id), resources_already_seen);
    });
  },
      

  /////////////////////////////////////////////////////////////
  // Token Handling
  /////////////////////////////////////////////////////////////
  
  // storeToken will save a given token and it's supporting info
  // to the database.  Note future additions will include the user
  // it belongs to instead of the bookmarksid.
  storeToken: function(token, scope, bookmarksid) {
    db.tokens_map[token] = {
      scope: scope,
      bookmarksid: bookmarksid
    };
    log.debug("storeToken: token stored.  tokens_map is now: ", db.tokens_map);
  },

  getBookmarksIdForToken: function(token) {
    return _.get(db.tokens_map,  token + ".bookmarksid", false);
  },


  ///////////////////////////////////////////////////////////////
  // Debugging help
  ///////////////////////////////////////////////////////////////
  
  debugPrintContents: function() {
    log.debug("debugPrintContents: memory-db = ", db);
  },

};

module.exports = _MemoryDb;
