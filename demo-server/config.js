module.exports = {
  wellKnown: {
    well_known_version: '1.0.0',
    oada_base_uri: './',
    scopes_supported: [
      {
        name: 'oada.all.1', // can do anything the user can do
        /* pattern: /oada\..*\.1/ */
        'read+write': true, // can read/write anything the user can read/write
      }
    },
  },

  // If you want to hard-code the token used for testing, uncomment the auth below:
  auth: {
    token: "SJKF9jf309", // Hard-coded token for easy API testing
  },
  protocol: "https://",
};


