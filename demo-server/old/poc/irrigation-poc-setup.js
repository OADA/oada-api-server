// Holds special code necessary to setup Proof-Of-Concept 1 for prescription planting maps

var log = require.main.require('./lib/logger.js').child({ module: 'poc1' });
var db = require.main.require('./lib/memory-db.js');
var oada_util = require.main.require('./lib/oada-util.js');
var config = require.main.require('./config.js');

// Step 1: Set the scope handlers that should be used:
//   (read|write|read+write):oada.irrigation
//   (read|write|read+write):oada.irrigation.machines
//   read:oada.irrigation.machines.configuration
//   (read|read+write):oada.irrigation.machines.as-applied
//   (read|read+write):oada.irrigation.machines.prescription
//   (read|read+write):oada.irrigation.machiens.work-order
//   (read|read+write):oada.clients
//   valley.basetation3 --> probably don't need to test this for now
//   --> Should this be set in a config file for the demo server, rather than here in
//       a library? i.e. a map of scope_string -> handler function

// Step 1.a: create 2 tokens: one for grower and one for user that has clients list
//   - to do this right, we really should create 2 users, then multiple tokens
//     for each user testing the various scopes.  Then the test scripts can 
//     start by registering for all the necessary tokens for each user, login
//     can be default disabled for the test user somehow, so it can flow
//     automatically through the login process.
//
// Step 2: create machine info resources:
//   - configuration
//   - status
//   - applied
//   - vrizones
//   - vriPrescriptions
//   - workOrders
//
// Step 3: combine all those into a machine document
// Step 4: create /bookmarks/irrigation/machines with just one machine in the list
//         for token #1
// Step 5: create /bookmarks/irrigation with only the 'machines' key
// Step 6: create /bookmarks with only the 'irrigation' key
// Step 7: create a grower user (for use in clients) with bookmarks link 
//         as the one just created in /bookmarks
//
// Step 8: create a client list with the grower user in it
// Step 9: link the client list as /bookmarks/clients for token #2
// Step 10: add clients to bookmarks for token #2

var _Irrigation_Poc1_Setup = {
  // setup will build the initial tokens map for the demo, 
  // and setup the proper bookmarks for each token
  setup: function() {

    var machine = model.byMediaType('application/vnd.valleyix.machine.status.1+json').example();
    machine.config = model.byMediaType('application/vnd.valleyix.machine.status.1+json').example();
    machine.status = model.byMediaType('application/vnd.valleyix.machine.status.1+json').example();
    machine.applied = model.byMediaType('application/vnd.valleyix.machine.applied.1+json').example();
    machine.vriZones = model.byMediaType('application/vnd.valleyix.machine.VRIZones.1+json').example();
    machine.vriPrescriptions = model.byMediaType('application/vnd.valleyix.machine.VRIPrescriptions.1+json').example();
    machine.workOrders = model.byMediaType('application.vnd.valleyix.machine.workOrders.1+json').example();


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

module.exports = _Irrigation_Poc1_Setup;
