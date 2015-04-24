
////////////////////////////////////////////////////////////////////
// This mock server will store all incoming POSTs in memory
// in order to properly respond.  Therefore, if you leave it running
// a long time, it may die.  It is intended to be used for testing,
// not production.
////////////////////////////////////////////////////////////////////

// Note: in the middle of implementing the real responses from memory.  Realized
// I'm going to need a router for /resources in general, I think, because
// get /resources will really be get /resources/k13ij13 or /resources/20ioefjllsd
// Should also go ahead and fully implement bookmarks too.

var express = require("express");
var uuid = require("node-uuid");
var md5 = require("MD5");
var _ = require("lodash");

////////////////////////////////////////////////////////////////////
// Configuration parameters:
var config = {
  verbatim: true, // set to true to get the exact documents returned as-written in the spec
  auth: {
    skip_auth_check: true, // set to false if you want to require auth
    token: "SJKF9jf309", // From the tech spec, hard-coded auth token
  }
};


var app = express();
// Make sure I know what the etag is suppossed to be so I can return it 
// properly on POST
app.set('etag', function(body, encoding) {
  return md5(body);
});


///////////////////////////////////////////////////////////
// Helpful functions:

var checkAuth = function(req) {
  if (config.auth.skip_auth_check) return true;
  var req_header = req.get("Authorization");
  var req_token = req_header.replace("Bearer","").trim();
  if (req_token === config.auth.token) return true;
  return false;
};

var authError = function(res) {
  res.status(401).json({
    "code": "401",
    "status": "Unauthorized",
    "href": "https://github.com/OADA/oada-docs/blob/master/rest-specs/OAuth2.md",
    "title": "Invalid or missing token",
    "detail": "All requests to private OADA endpoint must be sent with an Authorization header that contains a valid Bearer token",
    "userMessage": "Please login"
  });
};

var populateRev = function(obj) {
  obj._rev = obj._rev || "0-0";
  var rev_seq = obj._rev.split("-")[0];
  rev_seq = +rev_seq; // coerce to int
  rev_seq += 1;
  obj._rev = rev_seq + "-" + md5(JSON.stringify(obj));
  return obj;
};

var populateMeta = function(obj) {
  obj._meta = obj._meta || { _metaid: obj._id };
  obj._meta = populateRev(obj._meta);
  return obj;
};


///////////////////////////////////////////////////////////
// Setup the initial resource maps:
var resources_map = {};
var meta_map = {};
var etags = {};
// Build the initial /bookmarks/planting/prescriptions
var bookmarksid = uuid.v4();
resources_map[bookmarksid] = populateRev(populateMeta({ 
  _id: bookmarksid,
  name: "planting.prescriptions",
  list: { }
}));


/////////////////////////////////////////////////////////
// Step 1: GET oada-configuration
app.get("/.well-known/oada-configuration", function(req, res) {
  if (config.verbatim) {
    res.set("Content-Type", "application/vnd.oada.oada-configuration.1+json");
    res.set("etag", "aabbccddeeffgg");
    res.json({
      "authorization_endpoint": "https://oada.caseih.com/authorization",
      "token_endpoint": "https://oada.caseih.com/token",
      "oada_base_uri": "https://oada.caseih.com",
      "registration_endpoint": "https://oada.caseih.com/register",
      "token_endpoint_auth_signing_alg_values_supported": [ "RS256" ]
    });
    return;
  }

  // Otherwise, respond intelligently:
  res.set("Content-Type", "application/vnd.oada.oada-configuration.1+json");
  // etag (weak etag) should be enabled by default
  res.json({
    "oada_base_uri": req.headers.host
  });

});


/////////////////////////////////////////////////////////
// Step 2: POST new rx maps as new resources:
app.post("/resources", function(req, res) {

  // Check bearer header:
  if (!checkAuth(req)) {
    return authError(res);
  }

  // Check content-type:
  if (req.get("Content-Type") !== "application/vnd.oada.planting.prescription.1+json") {
    return res.status(406).json({
      "code": "406",
      "status": "Not Acceptable",
      "href": "https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0",
      "title": "Invalid Content-Type",
      "detail": "This POC only accepts resources with Content-Type application/vnd.oada.planting.prescription.1+json",
      "userMessage": "Prescription upload failed."
    });
  }

  if(config.verbatim) {
    var generated_id = "02kdfj043";
    res.set("Location", "/resources/"+generated_id);
    res.set("x-oada-rev", "1-2389dfhd");
    res.set("etag", "aabbccddeeffgg");
    res.send("");
    return;
  }
  // Otherwise, respond intelligently: store the POSTed document in memory, generate an ID for it,
  // a _rev, a _metaid, and return the proper location
  var new_id = uuid.v4();
  var obj = _.merge(req.body, { _id: new_id, });
  obj = populateRev(populateMeta(obj));
  // Put the docs into their maps in memory:
  resources_map[obj._id] = obj;
  meta_map[obj._meta._metaid] = obj._meta._metaid;
  // Return the proper location, rev, and etag:
  res.set("Location", "/resources/"+obj._id);
  res.set("x-oada-rev", obj._rev);
  res.set("etag", md5(JSON.stringify(resources_map[obj._id])));
  res.send("");
  return;
});


//////////////////////////////////////////////////////////////
// Step 3: POST new resource link to the master list of prescriptions
app.post("/bookmarks/planting/prescriptions/list", function(req, res) {
  // Check bearer header:
  if (!checkAuth(req)) {
    return authError(res);
  }

  // Check content-type:
  if (req.get("Content-Type") !== "application/vnd.oada.planting.prescription.1+json") {
    return res.status(406).json({
      "code": "406",
      "status": "Not Acceptable",
      "href": "https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0",
      "title": "Invalid Content-Type",
      "detail": "This POC only accepts resources with Content-Type application/vnd.oada.planting.prescription.1+json",
      "userMessage": "Prescription upload failed."
    });
  }

  if (config.verbatim) {
    var generated_id = "02kdfj043";
    res.set("Location", "/resources/02kdfj043/list/"+generated_id);
    res.set("x-oada-rev", "5-89uhjdf9");
    res.set("etag", "aabbccddeeffgg");
    return res.send("");
  }
  // Otherwise, respond intelligently: add the new link to the list
  try { 
    var link = JSON.parse(req.body);
  } catch(e) {
    // they messed up the format: wouldn't parse with JSON
    return res.status(406).json({
      "code": "406",
      "status": "Not Acceptable",
      "href": "https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0",
      "title": "Invalid Request Body",
      "detail": "This POC only accepts resources with Content-Type application/vnd.oada.planting.prescription.1+json."
               +"For this endpoint, only a single link-style object is accepted.  Your body did not pass JSON.parse.",
      "userMessage": "Post to master list failed."
    });
  }
  // Post it to the list:
  var new_id = uuid.v4();
  resources_map[bookmarksid].list[new_id] = link;
  resources_map[bookmarksid] = populateRev(resources_map[bookmarksid]);
  // Respond with new location and rev:
  res.set("Location", "/resources/"+bookmarksid+"/list/"+new_id);
  res.set("x-oada-rev", resources_map[bookmarksid]._rev);
  res.set("etag", md5(JSON.stringify(resources_map[bookmarksid])));
  return res.send("");

});

//////////////////////////////////////////////////////////////
// Step 4: GET _rev on master prescription list to see if it has changed.
// Note that for verbatim mode, it always responds as if it has changed.
app.get("/bookmarks/planting/prescription/_rev", function(req, res) {
  if (config.verbatim) {
    res.set("Content-Type", "application/vnd.oada.planting.prescriptions.1+json");
    res.set("etag", "hhiijjkkllmmnnoopp");
    res.json({
      _rev: "6-5465asd2"
    });
    return;
  }
  // Otherwise, return the real one:
  res.set("Content-Type", "application/vnd.oada.planting.prescriptions.1+json");
  res.json({
    _rev: resources_map[bookmarksid]._rev
  });

});

//////////////////////////////////////////////////////////////
// Step 5: GET the master prescription list back to see which
// links have changed:
app.get("/bookmarks/planting/prescription", function(req, res) {
  if (config.verbatim) {
    res.set("Content-Type", "application/vnd.oada.planting.prescriptions.1+json");
    res.set("etag", "hhiijjkkllmmnnoopp");
    res.json({
      _id: "kd85uklsfd",
      _rev: "6-5465asd2",
      _meta: { _metaid: "kd85uklsfd", _rev: "7-kldjf029i" },
      name: "prescriptions",
      list: {
        "jf20kjd": { _id: "jf20kjd", _rev: "2-klsjdf02" },
        "0fjdksl": { _id: "0fjdksl", _rev: "5-kldfj02d" },
        "02kdfj043": { _id: "02kdfj043", _rev: "2-2df32432" }
      }
    });
    return;
  }
  // Otherwise, return the real one:
  res.set("Content-Type", "application/vnd.oada.planting.prescriptions.1+json");
  res.json(resources_map[bookmarksid]);
});

////////////////////////////////////////////////////////////////
// Step 6: GET the _meta document for the changed prescription
// to check on field reconciliation and transfer status:
app.get("/resources/02kdfj043/_meta", function(req, res) {
  if(config.verbatim) {
    res.set("Content-Type", "application/vnd.oada.planting.prescriptions.1+json");
    res.set("etag", "hhiijjkkllmmnnoopp");
    res.json({
      _metaid: "02kdfj043",
      _rev: "3-kdjf2ojd",
      fields: [
        { _id: "d30fjrjsd", _rev: "1-dkflj20wi" }
      ],
      transfer_status: {
        "02kdfjl93": {
          machine: { _id: "02kdfjl93", _rev: "195-sklfj02d2" },
          status: "PENDING"
        }
      }
    });
    return;
  }
});


var server = app.listen(3000, function () {
  var host = server.address().address;
  if (host === "::") host = "localhost";
  var port = server.address().port;
  console.log('Mock server listening at http://%s:%s', host, port);
  console.log("CTRL-C to stop");
});

