var fs = require('fs');
var path = require('path');

module.exports = {
  wellKnown: {
    well_known_version: '1.0.0',
    oada_base_uri: 'http://localhost:3000/',
    scopes_supported: [
      {
        name: 'oada.all.1', // can do anything the user can do
        /* pattern: /oada\..*\.1/ */
        'read+write': true, // can read/write anything the user can read/write
      }
    ],
  },
  oada_path_prefix: '/',

  // If you want to hard-code the token used for testing, uncomment the auth below:
  auth: {
    token: "SJKF9jf309", // Hard-coded token for easy API testing
  },
  protocol: "http://",
  domain: 'vip3.ecn.purdue.edu',
  port: 3000,
  certs: {
    key: fs.readFileSync(path.join(__dirname, 'certs/ssl/server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'certs/ssl/server.crt')),
    ca: fs.readFileSync(path.join(__dirname, 'certs/ssl/ca.crt')),
    requestCrt: true,
    rejectUnauthorized: false,
  },
  dbsetup: require('./dbsetups/sales.js'),
};
