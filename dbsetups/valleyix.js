// Creates example setup for valleyix
var Promise = require('bluebird');
var _ = require('lodash');

var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  ///////////////////////////////////////////////////////////
  // Inversion-of-Control required libraries:
  var res_driver = config.libs.db.resources();
  var users_driver = config.libs.db.users();
  var db = config.libs.db.db(); // for printContents
  var formats = config.libs.formats();
  formats.use(require('valleyix-formats'));

  var log = config.libs.log().child({ module: 'dbsetups/valleyix' });
  log.info('Using valleyix irrigation examples as initial setup');

  var cur_id = 1;

  var _Setup = {

    ///////////////////////////////////////////////////////
    // Definitions of tree of resource descriptors
    ///////////////////////////////////////////////////////

    user: function() {
      return {
        _meta: { _mediaType: 'application/vnd.oada.user.1+json' },
        bookmarks: _Setup.bookmarks(),
        username: 'frank',
        // password defined in auth_user below
      };
    },

    bookmarks: function(opts) {
      opts = opts || {};
      var ret = {
        overrideExample: true, // ignore the other bookmarks
        _meta: { _mediaType: 'application/vnd.oada.bookmarks.1+json' },
        irrigation: {
          _meta: { _mediaType: 'application/vnd.oada.irrigation.1+json' },
          machines: {
            _meta: { _mediaType: 'application/vnd.oada.irrigation.machines.1+json' },
            list: {
              overrideExample: true,
              'kd2j0fsldk': _Setup.machine(),
              '0928sdfk9j': _Setup.machine(),
            },
          },
        },
      };
      if (opts.noclients) return ret;
      ret.clients = {
        _meta: { _mediaType: 'application/vnd.oada.clients.1+json' },
        list: {
          overrideExample: true, // special thing I put here to replace example's list with this one
          '83jhf2oid': _Setup.grower(),
          '0kdfj20kd': _Setup.grower(),
        },
      };
      return ret;
    },

    machine: function() {
      return {
        _meta: { _mediaType: 'application/vnd.valleyix.machine.1+json' },
        configuration: {
          _meta: { _mediaType: 'application/vnd.valleyix.machine.configuration.1+json' },
        },
        status: {
          _meta: { _mediaType: 'application/vnd.valleyix.machine.configuration.1+json' },
        },
        applied: {
          _meta: { _mediaType: 'application/vnd.valleyix.machine.as-applied.1+json' },
        },
        workOrders: {
          _meta: { _mediaType: 'application/vnd.valleyix.machine.work-order.1+json' },
        },
        vriZones: {
          _meta: { _mediaType: 'application/vnd.valleyix.machine.VRIZones.1+json' },
        },
        vriPrescriptions: {
          overrideExample: true,
        },
      };
    },

    grower: function() {
      return {
        _meta: { _mediaType: 'application/vnd.valleyix.grower.1+json' },
        bookmarks: _Setup.bookmarks({ noclients: true }),
      };
    },

    auth_user: function() {
      return {
        username: _Setup.treeWithIds().username,
        password: 'pass',
        resource: { _id: _Setup.treeWithIds()._id },
      };
    },

    /////////////////////////////////////////////////////////
    // Actual tree to build with the stuff filled in:
    _treeWithIds: null,
    treeWithIds: function() {
      if (!_Setup._treeWithIds) {
        var tree_descriptors = _Setup.populateDescriptors(_Setup.user());
        _Setup._treeWithIds = _Setup.populateIds(tree_descriptors);
      }
      return _Setup._treeWithIds;
    },



    //////////////////////////////////////////////////////////
    // Helpful functions
    //////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////
    // Now build the descriptors tree using the functions defined above:
    populateDescriptors: function(obj) {
      var ret = (_.isArray(obj)) ? [] : {};
      _.each(obj, function(val, key) {
        if (typeof val === 'function') {
          ret[key] = val();
        }
        if (typeof val === 'object') {
          ret[key] = _Setup.populateDescriptors(val);
          return;
        }
        ret[key] = val;
      });
      return ret;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Walk through entire tree and assign id's to anything with an _meta:
    populateIds: function(obj) {
      var ret = (_.isArray(obj)) ? [] : {};
      // This object only needs an Id if it has a media type in the tree
      if (obj._meta) {
        ret._id = ''+cur_id++;
      }
      _.each(obj, function(val, key) {
        if (typeof val === 'object') {
          ret[key] = _Setup.populateIds(val);
          return;
        }
        ret[key] = val;
      });
      return ret;
    },


    ///////////////////////////////////////////////////////////////////////////
    // Given an example, override any keys with override values in the descriptor
    replaceOverrides: function(desc, example) {
      if (!desc) return example; // no descriptor for this level, no need to check further
      var ret;
      if (typeof desc === 'object' && desc.overrideExample) {
        ret = _.cloneDeep(desc);
        delete ret.overrideExample;
        return ret;
      }
      ret = (_.isArray(example)) ? [] : {};
      _.each(example, function(val, key) {
        if (desc[key] && desc[key].overrideExample) {
          ret[key] = _.cloneDeep(desc[key]);
          delete ret[key].overrideExample;
          return;
        }
        if (typeof val !== 'object') {
          ret[key] = val;
          return;
        }
        ret[key] = _Setup.replaceOverrides(desc[key], val);
      });
      return ret;
    },

    ///////////////////////////////////////////////////////////////////////////
    // Replace anything that looks like a link in example() with
    // the correct link id from desc
    replaceLinks: function(desc, example) {
      var ret = (_.isArray(example)) ? [] : {};
      if (!desc) return example;  // no defined descriptors for this level
      _.each(example, function(val, key) {
        if (typeof val !== 'object' || !val) {
          ret[key] = val; // keep it as-is
          return;
        }
        if (val._id) { // If it's an object, and has an '_id', make it a link from descriptor
          ret[key] = { _id: desc[key]._id, _rev: '0-0' };
          return;
        }
        ret[key] = _Setup.replaceLinks(desc[key],val); // otherwise, recurse into the object looking for more links
      });
      return ret;
    },

    //////////////////////////////////////////////////////////////////////////
    // Recursively put all the new objects as resources
    putLinkedTree: function(desc) {
      // If there are any sub-objects, put them first:
      return Promise.each(_.keys(desc), function(key) {
        var val = desc[key];
        if (typeof val === 'object' && val) {
          return _Setup.putLinkedTree(val);
        }
      })
      .then(function() {
        // TODO: This is sort of a hack but I don't fully understand the flow
        // to rework it upstream. This seems to work...
        if (!desc._id) throw {cancel: true}; // don't put non-resources
        // Get the example
        return formats.model(desc._meta._mediaType);
      })
      .call('example', 'default')
      .then(function(resource) {
        // Override any lists with keys in descriptor
        resource = _Setup.replaceOverrides(desc, resource);
        // Set the _id on the example object
        resource._id = desc._id;
        // Replace any resources at this level of example with links
        resource = _Setup.replaceLinks(desc, resource);

        // Put the new resource:
        log.debug('putLinkedTree: example._id = ', resource._id, ', desc._meta = ', desc._meta);
        return res_driver.put('/'+resource._id, resource, { _meta: desc._meta })
        .then(function() {
          // return a link to the object we put (for testing).
          return { _id: resource._id };
        });
      })
      .catch(function(e) {
          // Skip non-resource objects
          if(!e.cancel) {
              throw e;
          }
      });
    },


    //////////////////////////////////////////////////////////////////////
    // Auth
    //////////////////////////////////////////////////////////////////////

    putAuth: function(desc) {
      return users_driver
      .set(desc.username, desc);
    },


    /////////////////////////////////////////////////////////////////
    // Main function called in server.js when it's time to build the
    // initial database:
    setup: function() {
      var user_link = null;
      return _Setup.putLinkedTree(_Setup.treeWithIds())
      .then(function(link) {
        user_link = link;
        return _Setup.putAuth(_Setup.auth_user());
      }).then(function() {
        return user_link;
      });
    },
  };

  singleton = _Setup;
  return singleton;
};
