var _ = require('lodash');
var content_type_parser = require('content-type');

var log = require.main.require('./lib/logger.js').child({ module: 'resources-handler' });
var oada_util = require.main.require('./lib/oada-util.js');
var mediatype_parser = require.main.require('./lib/mediatype-parser.js');
var scopes = require.main.require('./lib/scopes.js');
var validator = require.main.require('./lib/scopes.js');
var db = require.main.require('./lib/memory-db.js');
var oada_errors = require.main.require('./lib/oada-errors.js');

var _ResourcesHandler = {

  get:  function(req,res) {
    log.info("GET " + req.url);
    // This could be optimized by first checking the if-none-match condition,
    // then later getting the whole resource back.
    if (!scopes.checkRequest(req, res)) return;

    var path = req.url.replace(/^\/resources\//,'');
    var info = db.getByPath(path, { include_supporting_info: true, follow_last_link: true });
    if (!info || !info.value) return oada_errors.notFoundError(res);
    if (!info.link_to_resource) return oada_errors.cannotGetAllResources(res);

    var meta_link = oada_util.metaToId({ _metaid: info.link_to_resource._id });
    log.debug('get: meta_link = ', meta_link);
    var meta = db.get(meta_link);
    var contenttype = _.get(meta, "_mediaType", null);
    res.set('content-type', contenttype);
    res.set('x-oada-rev', info.link_to_resource._rev);
    res.set('etag', info.link_to_resource._rev);
    if (typeof info.value === 'string') {
      res.write('"'+info.value+'"');
    } else if (typeof info.value === 'number') {
      res.write(info.value);
    } else if (typeof info.value === 'object') {
      res.write(JSON.stringify(info.value));
    }
    res.end();
  },


  put: function(req,res) {
    log.info("PUT" + req.url);
    if (!scopes.checkRequest(req, res)) return;
    if (!validator.checkRequest(req, res)) return oada_errors.invalidResultingDocument(res);

    // Only supports JSON stuff at the moment
    try {
      var val = JSON.parse(req.body.toString());
    } catch(err) {
      return oada_errors.invalidResultingDocument(res);
    }

    var path = req.url.replace(/^\/resources\//,'');
    var contenttype = _.get(db.getMeta(info._id), "_mediaType", null);

// STOPPED HERE: need to get mediatype for POST and PUT if creating a new
// resource (put in options._mediaType?)
// Also, need to loop through all keys in the doc that was sent and set 
// each one individually (best done in setByPath rather than here)
// because PUT should only mess with the keys given at the path, not replace the
// whole thing at the path.

    var link = db.setByPath(path, val, { _mediaType: contenttype });
    if (!link) return oada_errors.notFoundError(res);

    res.set('content-type', contenttype);
    res.set('x-oada-rev', link._rev);
    res.set('etag', link._rev);
    res.end();
  },


  post: function(req,res) {
    log.info("POST ", req.url);

    // Check that the token has scope to POST this:
    if (!scopes.checkRequest(req, res)) return; // scopes sends it's own oada-errors
    // Attempt to parse the posted object in question based on media type:
    var new_obj = mediatype_parser.parseHttpBody(req);
    var mediatype = _.get(content_type_parser.parse(req.headers['content-type']), 'type');
    if (!new_obj) return oada_errors.contentTypeError(res);

    var path = req.url
      .replace(/^\/resources\/?/, '') // get rid of /resources/
      .replace(/\/$/,'')            // get rid of trailing slashes
      .split('/');
    if (path.length < 1 || path[0] === '') {
      path = []; // for some reason ('').split('/') gives [ '' ] instead of []
    }
    log.debug('post: path without new_id = ', path);

    var new_id;
    if (path.length < 1) { // POST /resources
      log.debug('post: posting to /resources');
      new_id = db.uniqueId();
      new_obj._id = new_id;

    } else {
      log.debug('post: posting to something other than /resources');
      var resinfo = db.pathWithoutLinks(path, {
        return_supporting_info: true,
        return_path_as_array: true
      });
      if (!resinfo) return oada_errors.cannotPostToNonexistentPath(res);
      path = resinfo.path;
      var parent_info = db.getByPath(resinfo.path, { type_and_length: true });
      if (parent_info.type === 'array') {
        new_id = parent_info.length;
      } else {
        new_id = db.uniqueId();
      }
    }

    path.push(new_id);

    obj_info = db.setByPath(path, new_obj, { _mediaType: mediatype });
    log.debug('post: finished setByPath('+path+').  Result = ', obj_info);
    if (!obj_info) return oada_errors.cannotPostToNonexistentPath();// fix this to be more accurate

    var location = '/resources/' + path.join('/');
    location = location.replace(/^\/resources\/meta:([^\/]+)/, '/meta/$1');
    log.debug('setByPath: final location = ', location);

    // Return the proper location, rev, and etag:
    res.set("location", location);
    res.set("x-oada-rev", obj_info._rev);
    res.set("content-type", req.headers["content-type"]);
    res.set("etag", obj_info._rev);
    res.end();
  },


  delete: function(req,res) {
    log.info("DELETE" + req.url);
    throw "You need to implement DELETE for resources";
  },


};

module.exports = _ResourcesHandler;
