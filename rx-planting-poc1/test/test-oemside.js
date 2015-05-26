var expect = require("chai").expect;
var request = require("request-promise");
var Promise = require("bluebird");
Promise.longStackTraces();
var fs = Promise.promisifyAll(require("fs"));
var _ = require("lodash");

var config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));


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

/////////////////////////////////////////////////////////
// Step 0: get oada-configuration to figure out oada_base_uri
var Tests = {
  oada_base_uri: null,
  posted_rx_vlink: null,
  rx_to_send: null,
  meta_to_put: null,

  // 0: get ./well-known
  getWellKnown: function() {
    describe("#step 0: get /.well-known/oada-configuration", function() {
      var json_response;
      var headers;

      before(function() {
        var options = {
          uri: config.host + "/.well-known/oada-configuration",
          simple: false,
          resolveWithFullResponse: true,
        };
        return request(options)
        .then(function(res) {
          json_response = JSON.parse(res.body.toString());
          config.oada_base_uri = json_response.oada_base_uri;
          headers = res.headers;
        });
      });

      it("should respond with a document that contains oada_base_uri", function() {
        expect(json_response).to.contain.keys("oada_base_uri");
      });
      it("should have content-type = application/vnd.oada.oada-configuration.1+json", function() {
        helpers.compareContentType(headers, "application/vnd.oada.oada-configuration.1+json");
      });

      after(function() {
        Tests.oada_base_uri = json_response.oada_base_uri;
      });
    });
  },

  // 1-2: post new prescription to /resources, get it back and check
  postRx: function() {
      describe("#step 1-2: post RX file to resources", function() {
        var doc_retrieved;
        var meta_retrieved;
        var post_headers_returned;
        Tests.rx_to_send = fs.readFileSync(__dirname + '/example_rx.orx').toString();
        var mediatype = "application/vnd.oada.planting.prescription.1+json";

        before(function() {
          var options = {
            uri: Tests.oada_base_uri + "/resources",
            method: "POST",
            headers: {
              "content-type": mediatype,
              Authorization: "Bearer "+config.auth.token,
            },
            body: Tests.rx_to_send,
            simple: true, resolveWithFullResponse: true, // 'simple: true' rejects promise if not 2xx response
          };
          // Post the new one:
          return request(options)
          .then(function(res) {
            // Keep for later:
            post_headers_returned = res.headers;
            Tests.posted_rx_vlink = {
              _id: res.headers.location.replace(/^\/resources\//,''),
              _rev: res.headers['x-oada-rev'],
            };

            // Get the posted one back, and it's meta doc
            return Promise.map([
              res.headers.location,
              res.headers.location.replace(/^\/resources/, '/meta'),
            ], function(url) {
              return request({
                uri: Tests.oada_base_uri + url,
                headers: { Authorization: "Bearer "+config.auth.token },
                simple: false, resolveWithFullResponse: true,
              }).then(function(res) {
                if (url.match(/^\/resources/)) {
                  doc_retrieved = res.body.toString();
                } else {
                  meta_retrieved = res.body.toString();
                }
              });
            });
          });
        });

        it("should have valid headers returned from the POST", function() {
          expect(post_headers_returned).to.contain.keys([ 'location', 'x-oada-rev', 'content-type' ]);
        });

        it("should have sent back a document with _id, _rev, and _meta", function() {
          var returned_rx = JSON.parse(doc_retrieved);
          expect(returned_rx).to.contain.keys( [ '_id', '_rev', '_meta' ]);
          expect(returned_rx._meta).to.contain.keys( [ '_metaid', '_rev' ]);
          expect(returned_rx._id).to.equal(returned_rx._meta._metaid);
       });

        it("should have sent back a valid meta document with the correct _mediaType", function() {
          var returned_meta = JSON.parse(meta_retrieved);
          var returned_rx = JSON.parse(doc_retrieved);
          expect(returned_meta).to.contain.keys( [ '_metaid', '_rev', '_mediaType' ] );
          expect(returned_meta._mediaType).to.equal(mediatype);
          expect(returned_meta._metaid).to.equal(returned_rx._meta._metaid);
        });

        it("should have given back a valid prescription that matches the one we sent", function() {
          var returned_rx = JSON.parse(doc_retrieved);
          var sent_rx = JSON.parse(Tests.rx_to_send);
          expect(returned_rx).to.contain.keys(_.keys(sent_rx));
          expect(returned_rx.zones).to.deep.equal(sent_rx.zones);
          expect(returned_rx.geojson).to.deep.equal(sent_rx.geojson);
          expect(returned_rx.name).to.deep.equal(sent_rx.name);
        });

        after(function() {
        });

    });
  },

  // 3: Post the new prescription id to the prescription list
  postLinkToRxList: function() {
    describe("#step 3: post RX file to bookmarks/planting/prescriptions/list", function() {
      var mediatype = "application/vnd.oada.planting.prescriptions.1+json";
      var post_headers_returned = null;
      var rx_received = null;

      before(function() {
        var options = {
          uri: Tests.oada_base_uri + "/bookmarks/planting/prescriptions/list",
          method: "POST",
          headers: {
            "content-type": mediatype,
            Authorization: "Bearer "+config.auth.token,
          },
          body: JSON.stringify(Tests.posted_rx_vlink),
          simple: true, resolveWithFullResponse: true, // reject promise if not 2xx response
        };

        return request(options)
        .then(function(res) {
          post_headers_returned = res.headers;
          if (!_.get(res, 'headers.location', "").match(/^\/resources/)) {
            throw new Error("#step 3: invalid location returned from POST ("+res.headers.location+").  Not issuing subsequent GET.");
          }
        

          // Get the link back now to compare with what we sent
          return request({
            uri: Tests.oada_base_uri + res.headers.location,
            headers: { Authorization: "Bearer "+config.auth.token, },
            simple: false, resolveWithFullResponse: true,
          });
        }).then(function(res) {
          rx_received = res.body.toString();
        });
      });

      it("should have valid headers returned from the POST", function() {
        expect(post_headers_returned).to.contain.keys([ 'location', 'x-oada-rev', 'content-type' ]);
      });

      it("should have sent back the resource with our RX in it", function() {
        var parsed_rx = JSON.parse(rx_received);
        var sent_rx = JSON.parse(Tests.rx_to_send);
        expect(parsed_rx.name).to.deep.equal(sent_rx.name);
        expect(parsed_rx.zones).to.deep.equal(sent_rx.zones);
        expect(parsed_rx.geojson).to.deep.equal(sent_rx.geojson);
        expect(parsed_rx._id).to.equal(Tests.posted_rx_vlink._id);
        expect(parsed_rx._rev).to.match(/^[0-9]+-.+$/);
        expect(parsed_rx._meta).to.contain.keys(['_metaid', '_rev']);
      });

      after(function() {
      });

    });
  },

  // 4: Put a meta doc to the prescription with fields and transfer status
  // Use a special admin-scoped token to distinguish from a client doing this
  putMetaFieldsAndStatus: function() {
    describe("#step 4: PUT /meta/:id { fields, transfer_status }", function() {
      var mediatype = "application/vnd.oada.planting.prescription.1+json";

      Tests.meta_to_put = {
        fields: [ { _id: 'kd02jd0f2j' } ],
        transfer_status: {
          '02ijlkjsdlf': { 
            machine: { _id: '02ijlkjsdlf' },
            status: 'PENDING'
          },
        },
      };
         
      var put_headers_returned;
      var meta_url;
      var meta_retrieved;
      before(function() {
        meta_url = "/meta/" + Tests.posted_rx_vlink._id;
        var options = {
          uri: Tests.oada_base_uri + meta_url,
          method: "PUT",
          headers: {
            "content-type": mediatype,
            Authorization: "Bearer "+config.admin_auth.token,
          },
          body: JSON.stringify(Tests.meta_to_put),
          simple: true, resolveWithFullResponse: true, // 'simple: true' rejects promise if not 2xx response
        };
        // Make PUT request:
        return request(options)
        .then(function(res) {
          // Keep for later:
          put_headers_returned = res.headers;

          // Get the meta doc back:
          return request({
            uri: Tests.oada_base_uri + meta_url,
            headers: { Authorization: "Bearer "+config.auth.token },
            simple: true, resolveWithFullResponse: true,
          }).then(function(res) {
            meta_retrieved = res.body.toString();
          });
        });
      });

      it('should return a valid location for the meta resource', function() {
        var location = put_headers_returned.location;
        expect(location).to.equal(meta_url);
      });

      it('should have the new "fields" and "transfer_status" keys after getting the meta resource back', function() {
        var parsed_meta = JSON.parse(meta_retrieved);
        var sub_doc = { fields: parsed_meta.fields, transfer_status: parsed_meta.transfer_status };
        expect(sub_doc).to.deeply.equal(Tests.meta_to_put);
      });
    });
  },
};


// Give auto-watching script a little time to restart:
describe("Broader test suite for Rx Planting POC", function() {
  // -1: run a setup to create bookmarks
  // 1: post a precription, then get it's id and _rev back, store them.
  // 2: verify you can get the prescription back with proper keys
  // 3: post id to prescription list, get the list back, keep the _rev
  // 4: put a meta doc to the prescription with fields and transfer_status
  // 5: check that _rev on prescription file has changed (should be in x-oada-rev header)
  // 6: check that _rev on parent list has changed, and _rev on bookmarks has changed
  //    * note: with eventual consistency, this might take awhile.  How to test?
  // 7: check that etags change as well for all docs

  Tests.getWellKnown();
  Tests.postRx();
  Tests.postLinkToRxList();
  Tests.putMetaFieldsAndStatus();

});

