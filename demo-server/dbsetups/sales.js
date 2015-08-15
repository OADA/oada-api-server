// Creates one user with the config.auth token, creates it's bookmarks (empty),
// and creates one resource at id 123.
var Promise = require('bluebird');
var _ = require('lodash');

var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var res_driver = config.drivers.db.resources();
  var auth_driver = config.drivers.db.auth();
  var db = config.drivers.db.db(); // for printContents
  
  var log = config.drivers.log().child({ module: 'dbsetups/sales' });
  
  log.info('Using tickets/sales initial db setup');
  
  var _Setup = {
    user: {
      _id: '1',
      _meta: { _mediaType: 'application/vnd.oada.user.1+json' },
    },
    bookmarks: {
      _id: '2',
      _meta: { _mediaType: 'application/vnd.oada.bookmarks.1+json' },
    },
    tickets: {
      _id: '4',
      _meta: { _mediaType: 'application/vnd.oada.sales.tickets.1+json' },
    },
    sales: {
      _id: '5',
      _meta: { _mediaType: 'application/vnd.oada.sales.1+json' },
    },
  
    setup: function() {
      // Create the bookmark:
      return res_driver.put('/'+_Setup.bookmarks._id, 
        { }, 
        { _meta: _Setup.bookmarks._meta }
  
      // Create the user:
      ).then(function() {
        return res_driver.put('/'+_Setup.user._id,
          { bookmarks: { _id: _Setup.bookmarks._id, _rev: '0-0' } }, 
          { _meta: _Setup.bookmarks._meta }
        );
  
      // Create the token:
      }).then(function() {
        return auth_driver.set(config().auth.token, {
          userid: _Setup.user._id,
        });
     
      // Create /bookmarks/sales/tickets resource
      }).then(function() {
        return res_driver.put('/' + _Setup.tickets._id,
          { list: {} }, 
          { _meta: _Setup.tickets._meta }
        );
      // Create /bookmarks/sales resource
      }).then(function() {
        return res_driver.put('/' + _Setup.sales._id,
          { tickets: { _id: _Setup.tickets._id, _rev: '0-0' } },
          { _meta: _Setup.sales._meta }
        );
      // Put the sales in the bookmarks:
      }).then(function() {
        return res_driver.put('/' + _Setup.bookmarks._id,
          { sales: { _id: _Setup.sales._id, _rev: '0-0' } },
          { _meta: _Setup.bookmarks._meta }
        );
  
      }).then(function() {
  //      db.printContents();
      });
    },
    
  };

  singleton = _Setup;
  return singleton;
};
