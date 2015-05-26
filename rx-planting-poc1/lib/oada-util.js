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

  isVersionedLink: function(obj) {
    return (_.has(obj, "_id") || _.has(obj, "_metaid")) && _.has(obj, "_rev");
  },
  isLink: function(obj) {
    return (_.has(obj, "_id") || _.has(obj, "_metaid"));
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
