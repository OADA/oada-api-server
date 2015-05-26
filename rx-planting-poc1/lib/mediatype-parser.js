var _ = require('lodash');
var log = require.main.require('./lib/logger.js').child({ module: "mediatype-parser" });

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
};

var _MediaTypeParser = {

  // Given an HTTP request with a body (like a POST or PUT), 
  // attempt to parse the body based on media type.
  parseHttpBody: function(http_request) {
    var mediatype = http_request.headers['content-type'].toLowerCase();
    if (!_.has(parsers, mediatype)) {
      log.trace('parseHttpBody: no parser available for media type '+mediatype);
      return null;
    }
    return parsers[mediatype](http_request.body);
  },

};

module.exports = _MediaTypeParser;
