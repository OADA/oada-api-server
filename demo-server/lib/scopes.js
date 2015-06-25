var _ = require('lodash');

var scope_map = {
  "bookmarks.planting.prescriptions": function(req, res) {
    log.error("You need to implement a scope handler for bookmarks.planting.prescriptions");
    return true;
  },
};


var _Scopes = {

  // Given an HTTP request, figure out if the token has permission to perform the requested action.  
  // If not, return the error function that needs to be run from oada-errors
  checkRequest: function(http_request, http_response) {
    return true; // allow everything for now until we get to this
// I think I probably want to separate out the actions within the scope handlers themselves, rather
// than making 4 separate scope handlers
//    if (action === "GET") return _Scopes.checkGetRequest(url, token, request_mediatype);
//    if (action === "POST") return _Scopes.checkPostRequest(url, token, request_mediatype);
//    if (action === "PUT") return _Scopes.checkPutRequest(url, token, request_mediatype);
//    if (action === "
  }

                /*
var helpers = {
  checkPostScope: function(url,token,request_mediatype) {
    // There are two ways a POST could fail due to mime type: 
    // - a token doesn't have scope to post that type of resource if it's /resources
    // - the user with the token doesn't have permission to alter a particular resource
    // - POSTing this thing to a subdocument in a resource doesn't match the resource itself
    // We're going to hard-code this for now, generalize later
    if (typeof tokens_map[token] === 'undefined') return false;
    var scopes = tokens_map[token].scopes;
    return _.reduce(scopes, function(result, scope) {

      var scope_parts = scope.split(':'); // read,write,create:bookmarks.planting.prescriptions
      var scope_actions = scope_parts[0].split(','); // [read,write,create]
      var scope_type = scope_parts[1];    // bookmarks.planting.prescriptions

      if (scope === 'bookmarks.planting.prescriptions') {
        // Have to at least have write or create permission for planting prescriptions to do a POST:
        if (!_.contains(scope_actions, 'write') || !_.contains(scope_actions('create'))) {
          return result || false; // have to at least have write or create permission
        }

        // Can only post to /resources or /bookmarks/planting/prescriptions:
        // If posting to /resources, check whether the media type is an allowed prescription media type:
        if (url === '/resources') {
          return result || (request_mediatype === 'application/vnd.oada.planting.prescription.1+json');
        }

        // The only other valid place to POST is the list of prescriptions in bookmarks.  We expect the URL
        // here to have already replaced the /bookmarks with the resource it points to
        var resid = url.replace(/^\/resources\/([^\/]+)(\/.*)?$/,'$1');
        if (resid !== bookmarksid) {
          return result || false;
        }
        var bookmarks_path = url.replace(/^\/resources\/([^\/]+)(\/.*)?$/,'$2');
        if (url !== '/planting/prescriptions/list') {
          return result || false;
        }
        // Check that the media type is the same as the bookmark:
        if (request_mediatype !== 'application/vnd.oada.planting.prescriptions.1+json') {
          return result || false;
        }
        
        // If we got here, they are allowed to post.
        return true;

      } else {
        return result || false;
      }
    }, false)
  },

  validateAction: function(opt) { 
    //'content-type': req.headers['content-type'], 
    //'location': req.headers.location
    // method: 'POST', 
    // body: req.body.toString() 
    if (opt['content-type'] !== 'application/vnd.oada.planting.prescriptions.1+json')
      return 'Unsupported mime type.  Only application/vnd.oada.planting.prescriptions.1+json is supported for this POC at this endpoint.';
    if (opt.method !== 'POST') 
      return 'Unsupported action.  Only POST is supported for this POC.';
    if (opt.location !== '/bookmarks/planting/prescriptions/list')
      return 'Unsupported location.  Only /bookmarks/planting/prescriptions/list is supported for this POC.';
    // Check if the link posted is valid JSON, and points to an existing resource which is a prescription:
    try {
      var link = JSON.parse(opt.body);
      if (typeof resources_map[link._id] === 'undefined') {
        // Should also test in the future if the resource at link._id is a prescription resource
        return '_id in the link you posted does not exist as a resource.';
      }
      return false; // Validates properly!
    } catch(e) {
      return 'Body could not be parsed as JSON.';
    }
  },

};
*/


};

module.exports = _Scopes;
