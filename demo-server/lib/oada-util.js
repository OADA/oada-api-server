var _ = require('lodash');

var _OADAUtil = {

  // Given a resource or meta object, return an object that represents the link
  link: function(obj) {
    if (!obj) return null;
    if (_.has(obj, '_metaid')) return { _id: "meta:"+obj._metaid, _metaid: obj._metaid };
    if (!_.has(obj, '_id')) return null;
    if (obj._id.match(/^meta:/)) return { _id: obj._id, _metaid: obj._id.replace(/^meta:/,"") };
    return { _id: obj._id };
  },
  versionedLink: function(obj) {
    var ret = _OADAUtil.link(obj);
    ret._rev = obj._rev;
    return ret;
  },

  // Is either { _id: , _rev }, or { _metaid: , _rev }
  isVersionedLink: function(obj) {
    return (_.has(obj, "_id") || _.has(obj, "_metaid")) 
      && _.has(obj, "_rev")
      && (_.keys(obj).length === 2); // no other keys
  },

  // Is either: 
  // { _id: , _rev }, { _metaid: , _rev }, { _id: }, or { _metaid: }
  isLink: function(obj) {
    return _OADAUtil.isVersionedLink(obj) // { _id: , _rev } or { _metaid: , _rev }
      || (   (_.has(obj, '_id') || _.has(obj, '_metaid'))  // { _id: } or { _metaid: }
          && (_.keys(obj).length === 1 ) );
  },
  isMetaLink: function(obj) {
    return _OADAUtil.isVersionedLink(obj) && _.has(obj, '_metaid');
  },

  // If the object has _metaid instead of _id, make the meta: _id for it
  metaToId: function(obj) {
    obj._id = obj._id || ('meta:'+obj._metaid);
    return obj;
  },
  idToMeta: function(obj) {
    if (!_.has(obj._id)) return obj;
    if (!obj._id.match(/^meta:/)) return obj;
    obj._metaid = obj._id.replace(/^meta:/,'');
    delete obj._id;
    return obj;
  },
    

  // Given an HTTP request object, parse out it's Authorization token 
  // and return it.
  getAuthorizationTokenFromRequest: function(http_request) {
    var req_header = http_request.headers['authorization'];
    if (typeof req_header !== 'string') return false;
    return req_header.replace(/bearer/i,'').trim();
  },


};

module.exports = _OADAUtil;
