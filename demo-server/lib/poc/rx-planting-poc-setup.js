// Holds special code necessary to setup Proof-Of-Concept 1 for prescription planting maps

var log = require.main.require('./lib/logger.js').child({ module: 'poc1' });
var db = require.main.require('./lib/memory-db.js');
var oada_util = require.main.require('./lib/oada-util.js');
var config = require.main.require('./config.js');

var _Poc1 = {
  // setup will build the initial tokens map for the demo, 
  // and setup the proper bookmarks for each token
  setup: function() {
    // Create /bookmarks/planting/prescriptions:
    var prescriptions = db.newResource({
      name: 'planting.prescriptions',
      list: { }
    }, { _mediaType: 'application/vnd.oada.planting.prescriptions.1+json' });

    var planting = db.newResource({
      name: 'planting',
      prescriptions: oada_util.versionedLink(prescriptions),
    }, { _mediaType: 'application/vnd.oada.planting.1+json' });

    var bookmarks = db.newResource({
      name: 'bookmarks',
      planting: oada_util.versionedLink(planting),
    }, { _mediaType: 'application/vnd.oada.bookmarks.1+json' } );

    // Store the bookmark resourceid that was just created as the 
    // proper one for this token.  In the future, it will be stored
    // with users instead of tokens.
    db.storeToken(config.auth.token, 'bookmarks.planting.prescriptions', bookmarks._id);

    // Print the current setup
    log.info("setup: printing initial db contents");
    db.debugPrintContents();
  },

};

module.exports = _Poc1;
