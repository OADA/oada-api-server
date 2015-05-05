var expect = require("chai").expect;
var request = require("request-promise");
var Promise = require("bluebird");
Promise.longStackTraces();
var fs = Promise.promisifyAll(require("fs"));
var _ = require("lodash");

var config = {
  verbatim: false,
  host: "http://52.4.148.83:3000",
  auth_token: "SJKF9jf309",
};

var helpers = {
  authTests: function(options) {
    it("should respond with code 401 when using no auth token", function(done) {
      var tmpopt = _.cloneDeep(options);
      delete tmpopt.headers.Authorization;
      request(tmpopt).then(function(res) {
        expect(res.statusCode).to.equal(401);
        done();
      }).catch(done);
    });
    it("should respond with code 401 when using the wrong auth token", function(done) {
      var tmpopt = _.cloneDeep(options);
      tmpopt.headers.Authorization = "Bearer 12345";
      request(tmpopt).then(function(res) {
        expect(res.statusCode).to.equal(401);
        done();
      }).catch(done);
    });
  },

  mimeTests: function(options, invalid_body) {
    it("should respond with code 406 if the mime type is not set", function(done) {
      var tmpopt = _.cloneDeep(options);
      delete tmpopt.headers["content-type"];
      request(tmpopt).then(function(res) {
        expect(res.statusCode).to.equal(406);
        done();
      }).catch(done);
    });

    it("should respond with code 406 if the mime type is not valid for this auth token (only application/vnd.oada.planting.prescription.1+json is valid)", function(done) {
      var tmpopt = _.cloneDeep(options);
      tmpopt.headers["content-type"] = "application/json"; // this is only testing planting prescriptions, not generic JSON uploads
      request(tmpopt).then(function(res) {
        expect(res.statusCode).to.equal(406);
        done();
      }).catch(done);
    });

    it("should respond with code 406 if the document does not pass validation", function(done) {
      var tmpopt = _.cloneDeep(options);
      tmpopt.body = invalid_body;
      request(tmpopt).then(function(res) {
        expect(res.statusCode).to.equal(406);
        done();
      }).catch(done);
    });
  },

  compareContentType: function(headers, mediatype) {
    // The content-type may have a charset (or other parameters) after it.  Get rid of them for comparison:
    expect(headers["content-type"].replace(/;.*$/,"")).to.equal(mediatype);
  },
};

describe("Rx Planting POC", function() {

  /////////////////////////////////////////////////////////
  // Step 1:
  describe("#step 1: get /.well-known/oada-configuration", function() {
    var json_response;
    var headers;
    before(function(done) {
      var options = {
        uri: config.host + "/.well-known/oada-configuration",
        simple: false,
        resolveWithFullResponse: true,
      };
      request(options).then(function(res) {
        json_response = JSON.parse(res.body.toString());
        headers = _.clone(res.headers);
        config.oada_base_uri = _.trimRight(json_response.oada_base_uri, '/');
        testsAfterOadaConfig();
        done();
      }).catch(done);
    });

    it("should respond with a document that contains oada_base_uri", function() {
      expect(json_response).to.contain.keys("oada_base_uri");
      config.oada_base_uri = json_response.oada_base_uri;
    });
    it("should have content-type = application/vnd.oada.oada-configuration.1+json", function() {
      helpers.compareContentType(headers, "application/vnd.oada.oada-configuration.1+json");
    });

  });

  // I split this up this way so that we can use the oada-configuration's oada_base_uri
  // for the rest of the tests.  The simplest way to do that was to wrap the bulk of the
  // tests with a function that is only called once the first get request for
  // oada-configuration is done.
  var testsAfterOadaConfig = function() {
    /////////////////////////////////////////////////////////
    // Step 2:
    var rx_to_post = fs.readFileSync(__dirname + "/example_rx.orx");
    describe("#step 2: POST new rx files to /resources", function() {

      var options = {
        uri: config.oada_base_uri + "/resources",
        method: "POST",
        headers: {
          "content-type": "application/vnd.oada.planting.prescription.1+json",
          Authorization: "Bearer "+config.auth_token,
        },
        body: rx_to_post.toString(),
        simple: false,
        resolveWithFullResponse: true,
      };

      helpers.authTests(options);
      helpers.mimeTests(options, options.body + ","); // set body as invalid JSON with extra comma for now

      it("should respond with new location, x-oada-rev, and proper content-type when successfully posted", function(done) {
        this.timeout(25000);
        var self = this;
        request(options).then(function(res) {
          var id_of_rx_posted = res.headers["location"].replace("/resources/", "");

          expect(res.statusCode).to.equal(200);
          expect(res.headers["location"]).to.match(/\/resources\/.+$/);
          expect(res.headers["x-oada-rev"]).to.match(/[0-9]+-.+$/);
          helpers.compareContentType(res.headers, "application/vnd.oada.planting.prescription.1+json");
          done();
        });
      });

    });

    /////////////////////////////////////////////////////////////
    // Step 3:
    describe("#step 3: POST new resource links to /bookmarks/planting/prescriptions/list", function() {

      var id_of_rx_posted;
      before(function(done) {
        this.timeout(25000);
        // We need to post a valid RX in order to get back a valid id:
        var post_rx_options = {
          uri: config.oada_base_uri + "/resources",
          method: "POST",
          headers: {
            "content-type": "application/vnd.oada.planting.prescription.1+json",
            Authorization: "Bearer "+config.auth_token,
          },
          body: rx_to_post.toString(),
          simple: false,
          resolveWithFullResponse: true,
        };
        request(post_rx_options).then(function(res) {
          // Parse the valid ID from the location header:
          id_of_rx_posted = res.headers.location.replace(/^.*\/resources\//, "").trim();
          done();
        }).catch(done);
      });

      it("should respond with code 406 if posting a link to a resource that doesn't exist", function(done) {
        var options = {
          uri: config.oada_base_uri + "/bookmarks/planting/prescriptions/list",
          method: "POST",
          headers: {
            "content-type": "application/vnd.oada.planting.prescriptions.1+json",
            Authorization: "Bearer "+config.auth_token,
          },
          body: JSON.stringify({ _id: "this_is_an_invalid_id", _rev: "0-0" }),
          simple: false,
          resolveWithFullResponse: true,
        };
        request(options).then(function(res) {
          expect(res.statusCode).to.equal(406);
          done();
        }).catch(done);
      });

      var options = {
        uri: config.oada_base_uri + "/bookmarks/planting/prescriptions/list",
        method: "POST",
        headers: {
          "content-type": "application/vnd.oada.planting.prescriptions.1+json",
          Authorization: "Bearer "+config.auth_token,
        },
        body: JSON.stringify({ _id: "dummy_id", _rev: "0-0" }),
        simple: false,
        resolveWithFullResponse: true,
      };

      helpers.authTests(options);
      helpers.mimeTests(options, options.body + ","); // invalid doc has invalid JSON

      it("should respond with code 200 and valid headers when posting a valid link", function(done) {
        this.timeout(25000);
        options.body = JSON.stringify({ _id: id_of_rx_posted, _rev: "0-0" });
        request(options).then(function(res) {
          expect(res.statusCode).to.equal(200);
          expect(res.headers["location"]).to.match(/\/resources\/.+$/);
          expect(res.headers["x-oada-rev"]).to.match(/[0-9]+-.+$/);
          done();
        }).catch(done);
      });

    });

    /////////////////////////////////////////////////////////////
    // Step 4: get the _rev on the master prescription list to see if it has changed
    describe("#step 4: GET /bookmarks/planting/prescriptions/_rev", function() {

      // Note: I should maintain a special counter in the mock server that, once
      // _rev has been polled once, it will update it to have the new stuff in
      // _meta for the transfer status and field.

      var options = {
        uri: config.oada_base_uri + "/bookmarks/planting/prescriptions/_rev",
        headers: {
          Authorization: "Bearer "+config.auth_token,
        },
        simple: false,
        resolveWithFullResponse: true,
      };

      var body;
      var headers;
      before(function(done) {
        request(options).then(function(res) {
          body = res.body.toString();
          headers = _.clone(res.headers);
          done();
        }).catch(done);
      });

      helpers.authTests(options);

      it("should return a valid _rev string", function() {
        expect(body).to.match(/"[0-9]+-.+$/);
      });

      it("should return a document with the correct content-type", function() {
        // since a charset may be added at the end of the content type, we need to get rid of it for the test.  bleh.
        helpers.compareContentType(headers, "application/vnd.oada.planting.prescriptions.1+json");
      });

    });

    /////////////////////////////////////////////////////////////
    // Step 5: get the master prescription list to see which links changed
    describe("#step 5: GET /bookmarks/planting/prescriptions", function() {
      var options = {
        uri: config.oada_base_uri + "/bookmarks/planting/prescriptions",
        headers: {
          Authorization: "Bearer "+config.auth_token,
        },
        simple: false,
        resolveWithFullResponse: true,
      };

      var json_returned;
      var headers;
      before(function(done) {
        request(options).then(function(res) {
          headers = _.clone(res.headers);
          try {
            json_returned = JSON.parse(res.body.toString());
          } catch(e) {
            done("ERROR: could not parse returned body for step 5!  parse error = " + e);
          }
          done();
        }).catch(done);
      });

      helpers.authTests(options);

      it("should return a document containing list and name keys", function() {
        expect(json_returned).to.contain.keys(["list", "name"]);
      });

      it("should contain at least one element inside the list", function() {
        expect(_.keys(json_returned.list).length).to.be.greaterThan(0);
      });

      it("should contain only things that look like valid links inside the list", function() {
        expect(_.filter(json_returned.list, function(link) {
          return !(link._id && link._rev.match(/[0-9]+-.+$/));
        })).to.be.empty;
      });

      it("should return a document with the correct content-type", function() {
        // since a charset may be added at the end of the content type, we need to get rid of it for the test.  bleh.
        helpers.compareContentType(headers, "application/vnd.oada.planting.prescriptions.1+json");
      });

    });

    /////////////////////////////////////////////////////////////
    // Step 6: get the _meta document for the changed prescription
    // to check on the field reconciliation and transfer status:
    describe("#step 6: GET _meta for a prescription file", function() {
      var id_of_rx_posted;
      var options = {
        uri: config.oada_base_uri + "/meta/dummy_id",
        headers: {
          Authorization: "Bearer "+config.auth_token,
        },
        simple: false,
        resolveWithFullResponse: true,
      };

      var _meta_doc;
      before(function(done) {
        this.timeout(25000);
        // POST a new prescription in order to get an ID for it:
        var post_options = {
          uri: config.oada_base_uri+ "/resources",
          method: "POST",
          headers: {
            "content-type": "application/vnd.oada.planting.prescription.1+json",
            Authorization: "Bearer "+config.auth_token,
          },
          body: rx_to_post.toString(),
          simple: false,
          resolveWithFullResponse: true,
        };
        // Post the new one:
        request(post_options).then(function(res) {
          id_of_rx_posted = res.headers["location"].replace(/^.*\/resources\//, "").trim();
          // Now GET the _meta doc for that resource:
          options.uri = config.oada_base_uri + "/meta/"+id_of_rx_posted;
          // Get the _meta doc:
          request(options).then(function(res) {
            try {
              _meta_doc = JSON.parse(res.body.toString());
            } catch(e) {
              return done("ERROR: could not parse returned JSON for step 6.  parse error = " + e + ", doc = " + res.body.toString());
            }
            return done();
          });
        }).catch(done);
      });

      helpers.authTests(options);

      // Note: since there is no guarantee that the document itself has ever been written to,
      // we cannot check for valid fields and transfer_status keys: we can only check them
      // if they happen to exist

      it("should return a valid _meta document", function() {
        expect(_meta_doc).to.contain.keys(["_metaid", "_rev"]);
      });

      it("should have a valid fields key if the fields key exists", function() {
        if (_meta_doc.fields) {
          expect(_meta_doc.fields).to.be.an('array');
          expect(_.filter(_meta_doc.fields, function(f) {
            return (typeof f._id === 'undefined');
          })).to.be.empty;
        }
      });

      it("should have a valid transfer_status key if the transfer_status key exists", function() {
        if (_meta_doc.transfer_status) {
          expect(_meta_doc.transfer_status).to.be.an('object');
          // And if there are any entries, make sure they are valid as well:
          if (_.keys(_meta_doc).length > 0) {
            expect(_.filter(_meta_doc.transfer_status, function(t) {
              return (typeof t.status === 'undefined');
            })).to.be.empty;
          };
        }
      });

    });
  };
});
