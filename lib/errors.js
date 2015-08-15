
var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var log = config.drivers.log().child({ module: 'errors' });
  // Pass the HTTP response object to these functions and they will write
  // standard OADA Errors to them.
  var _HTTPErrors = {
  
    // Something is wrong with the token:
    authError: function(res) {
      var result = {
        'code': '401',
        'status': 'Unauthorized',
        'href': 'https://github.com/OADA/oada-docs/blob/master/rest-specs/OAuth2.md',
        'title': 'Invalid or missing token',
        'detail': 'All requests to private OADA endpoint must be sent with an Authorization header that contains a valid Bearer token',
        'userMessage': 'Please login'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
    // The thing they requested didn't match any of the handlers:
    notFoundError: function(res) {
      var result = {
        'code': '404',
        'status': 'Not Found',
        'href': 'https://github.com/OADA/oada-docs',
        'title': 'Document not found.',
        'detail': 'The URL you requested does not exist.',
        'userMessage': 'Check your URL again.'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
    // The thing they are trying to do doesn't parse, or leaves a resource in an inconsistent state
    invalidResultingDocument: function(res, err) {
      var result = {
        'code': '406',
        'status': 'Not Acceptable',
        'href': 'https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0',
        'title': 'mimeType-based action validation error.',
        'detail': 'The result of your action would have invalidated the document.  The error was: '+err,
        'userMessage': 'Failed to perform action.'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
    // Sending an unsupported or invalid media type:
    // TODO: fix this to be helpful for POC1 somehow, but the function itself can still be generic.
    contentTypeError: function(res, info) {
      info = info || { mediatype: 'undefined' };
      var result = {
        'code': '406',
        'status': 'Not Acceptable',
        'href': 'https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0',
        'title': 'Invalid Content-Type',
        'detail': 'This POC only accepts certain media types and the one you sent was not one of them',
        'userMessage': 'Prescription upload failed.'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
    // Can't do GET /resources and expect to get all the resources back
    responseTooLarge: function(res) {
      var result = {
        'code': '403',
        'status': 'Forbidden',
        'href': 'http://github.com/oada/oada-docs',
        'title': 'Response too large',
        'detail': 'The response necessary to fulfill your request is too large for this service.  This generally happens with GET /resources.',
        'userMessage': 'Response data too large'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
    cannotPostToNonexistentPath: function(res) {
      var result = {
        'code': '403',
        'status': 'Forbidden',
        'href': 'http://github.com/oada/oada-docs',
        'title': 'Cannot post to non-object.',
        'detail': 'It is impossible to post to a string or number.  Can only post to arrays or objects.',
        'userMessage': 'Could not create item.'
      };
      log.info(result);
      return res.status(result.code).json(result);
    },
  
  };

  singleton = _HTTPErrors;
  return singleton;
};
