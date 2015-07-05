var Promise = require('bluebird');
var _ = require('lodash');
var log = require('./logger.js').child({ module: "mediatype-parser" });
var content_type_parser = require('content-type');
var oada_util = require('./oada-util.js');

var parsers = {

  // TODO: add validators after parsing
  "application/vnd.oada.planting.prescription.1+json": function(data) {
    try { return JSON.parse(data.toString()); }
    catch(err) { 
      log.trace('application/vnd.oada.planting.prescription.1+json: unable to parse JSON: ', err);
      return null; 
    }
  },

  //////////////////////////////////////////////
  // Bookmarks:
  "application/vnd.oada.planting.prescriptions.1+json": function(data) {
    try { return JSON.parse(data.toString()); }
    catch(err) { 
      log.trace('application/vnd.oada.planting.prescriptions.1+json: unable to parse JOSN: ', err);
      return null 
    }
  },

  "application/json": function(data) {
    try { return JSON.parse(data.toString()); }
    catch(err) {
      log.trace('application/json: unable to parse JSON: ', err);
      return null;
    }
  },
};

var _MediaTypeParser = {

  // Given an HTTP request with a body (like a POST or PUT), 
  // attempt to parse the body based on media type.
  parseHttpBody: function(http_request) {
    // For now, it only parses JSON bodies:
    return Promise.try(function() {
      if (!http_request.body.toString()) return;
      return JSON.parse(http_request.body.toString());
    });
    // The commented code below will lookup a parser based on media type
    /*
    var content_type = oada_util.parseContentType(http_request);

    if (!_.has(parsers, content_type)) {
      log.trace('parseHttpBody: no parser available for media type '+mediatype);
      return null;
    }
    return parsers[mediatype](http_request.body);
    */
  },

  // Returns true if we know how to parse the given http request's body
  // based on the content-type header, false otherwise
  canParse: function(req) {
    // For now, it only parses JSON bodies:
    return oada_util
    .parseContentType(req)
    .match(/\+json$/); // ends in +json
  },

};

module.exports = _MediaTypeParser;
