var Promise = require('bluebird');
var _ = require('lodash');
var express_router = require('express-promise-router');
var express = require('express');
var content_type_parser = require('content-type');

var oada_error = require('oada-error');

var log = require('./logger.js').child({ module: 'resources-handler' });
var oada_util = require('./oada-util.js');
var mediatype_parser = require('./mediatype-parser.js');
var scopes = require('./scopes.js');
var driver = require('./memory-db-resources-driver.js');


var resources_url_regexp = /^\/resources/;

var _ResourcesHandler = express_router();

///////////////////////////////////////////////
// GET handler:
_ResourcesHandler.get(resources_url_regexp, function(req,res) {
  var ret;
  var final_path;
  var path;
  
  return Promise.try(function() {
    log.info("GET " + req.url);
    return scopes.checkRequest(req);

  }).then(function() {
    path = req.url.replace(/^\/resources/,'');
    return driver.get(path);

  }).then(function(info) {
    if (!info || !info.found || !info.val) {
      throw new oada_error.OADAError('Path Not Found: ' + path, oada_error.codes.NOT_FOUND, 'Could not find ' + req.url, info);
    }
    
    ret = info.val;
    final_path = info.existent_path;
    var final_resourceid = driver.resourceidForPath(info.existent_path);
    // Note: you have to do the meta get after the get (as opposed to in parallel) because the resourceid
    // at the start of the path from the web is not necessarily the resourceid of the final resouce changed
    // if there are links on the path.
    if (!final_resourceid.match(/^meta:/)) {
      final_resourceid = 'meta:'+final_resourceid;
    }
    return driver.get('/'+final_resourceid+'/_mediaType');

  }).then(function(info) {
    var contenttype = info.val;
    res.statusCode = oada_error.codes.OK;
    res.set('content-type', contenttype);
    res.set('content-location', '/resources'+final_path);
    res.json(ret);
    res.end();
  });
}),


///////////////////////////////////////////////
// PUT handler
_ResourcesHandler.put(resources_url_regexp, function(req,res) {
  log.info("PUT " + req.url);
  var contenttype;
  return Promise.props({
    scope: scopes.checkRequest(req),
    //validator: validator.checkRequest(req), // add this later to validate the requested action (i.e. proper mediatype,etc.)
    body: mediatype_parser.parseHttpBody(req),

  // the scope or validator will throw if the request should not continue
  }).then(function(results) {
    var val = results.body;
    var path = req.url.replace(/^\/resources\//,'');
    contenttype = req.headers['content-type'];
    return driver.put(path, val, { _meta: { _mediaType: contenttype } });

  }).then(function(info) {
    res.statusCode = oada_error.codes.OK;
    res.set('content-type', contenttype);
    res.set('content-location', '/resources'+info.path);
    res.set('location', '/resources'+info.path);
    res.end();
  });

}),


///////////////////////////////////////////////
// POST handler
_ResourcesHandler.post(resources_url_regexp, function(req,res) {
  log.info("POST ", req.url);
  var contenttype;
  return Promise.props({
    scope: scopes.checkRequest(req),
    //validator: validator.checkRequest(req),
    body: mediatype_parser.parseHttpBody(req),

  // the scope or validator will throw if the request should not continue
  }).then(function(results) {
    var val = results.body;
    var path = req.url.replace(/^\/resources/,'');
    contenttype = req.headers['content-type'];
    return driver.post(path, val, { _meta: { _mediaType: contenttype } });

  }).then(function(info) {
    res.statusCode = oada_error.codes.OK;
    res.set('content-type', contenttype);
    res.set('location', '/resources'+info.path);
    res.set('content-location', '/resources'+info.path);
    res.end();
  });
}),


///////////////////////////////////////////////
// DELETE handler
_ResourcesHandler.delete(resources_url_regexp, function(req,res) {
  log.info("DELETE ", req.url);
  var contenttype;
  return Promise.props({
    scope: scopes.checkRequest(req),
    //validator: validator.checkRequest(req), // add validator later

  // the scope or validator will throw if the request should not continue
  }).then(function(results) {
    var path = req.url.replace(/^\/resources/,'');
    contenttype = req.headers['content-type'];

    return driver.delete(path);

  }).then(function(info) {
    res.statusCode = oada_error.codes.OK;
    res.set('content-type', contenttype);
    res.set('location', '/resources'+info.path);
    res.set('content-location', '/resources'+info.path);
    res.end();
  });

}),


module.exports = _ResourcesHandler;
