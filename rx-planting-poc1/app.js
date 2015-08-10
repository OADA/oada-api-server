
////////////////////////////////////////////////////////////////////
// This mock server will store all incoming POSTs in memory
// in order to properly respond.  Therefore, if you leave it running
// a long time, it may die.  It is intended to be used for testing,
// not production.
////////////////////////////////////////////////////////////////////

var express = require('express');
var uuid = require('node-uuid');
var _ = require('lodash');
var body_parser = require('body-parser');
var bunyan = require('bunyan');
var content_type_parser = require('content-type');
var cors = require('cors');
var fs = require('fs');
var https = require('https');

// Local libs:
var well_known_handler = require.main.require('./lib/well-known-handler.js');
 var bookmarks_handler = require.main.require('./lib/bookmarks-handler');
 var resources_handler = require.main.require('./lib/resources-handler');
      var meta_handler = require.main.require('./lib/meta-handler');
            var config = require.main.require('./config');
                var db = require.main.require('./lib/memory-db');
              var poc1 = require.main.require('./lib/poc1');
               var log = require.main.require('./lib/logger.js');
       var oada_errors = require.main.require('./lib/oada-errors.js');


log.info('-------------------------------------------------------------');
log.info('Starting server...');

/////////////////////////////////////////////////////////////////
// Setup express:
var app = express();
app.use(body_parser.raw({ 
  limit: '100mb',
  type: function(req) {
    // Need to parse content type because they have parameters like ;charset=utf-8
    var obj = content_type_parser.parse(req.headers['content-type']);
    return _.get(obj, "type", "").match(/\+json$/);
  }
}));
app.use(cors({ 
  exposedHeaders: [ 'x-oada-rev', 'location' ],
}));
app.options('*', cors()); // enable CORS for 'complex' requests
// Generic error handler to catch body-parser JSON errors:
app.use(function(err, req, res, next) {
  log.info('parser error? err = ', err);
  log.info('parser error? req = ', req);
  next();
});

///////////////////////////////////////////////////////////
// Helpful functions:
// Build the initial /bookmarks/planting/prescriptions and token:
poc1.setup();

/////////////////////////////////////////////////////////
// Setup the resources and bookmarks routes:
app.route(/^\/resources(\/.*)?/)
  .post(resources_handler.post)
  .get(resources_handler.get)
  .put(resources_handler.put)
  .delete(resources_handler.delete);

app.route(/^\/bookmarks(\/.*)?/)
  .post(bookmarks_handler.post)
  .get(bookmarks_handler.get)
  .put(bookmarks_handler.put)
  .delete(bookmarks_handler.delete);

app.route(/^\/meta(\/.*)?/)
  .post(meta_handler.post)
  .get(meta_handler.get)
  .put(meta_handler.put)
  .delete(meta_handler.delete);

app.route(/^\/.well-known(\/.*)?/)
  .get(well_known_handler.get);

app.use(function(req, res){
  log.info('NOT FOUND: ', req.url);
  return oada_errors.notFoundError(res);
});

/*
//////////////////////////////////////////////////////////////
// Step 3: POST new resource link to the master list of prescriptions
// app.post('/bookmarks/planting/prescriptions/list', function(req, res) {
app.post(/^bookmarks(\/.*)?/, function(req, res) {
  console.log('POST /bookmarks/planting/prescriptions/list');
  // Check bearer header:
  if (!helpers.checkAuth(req)) {
    return helpers.authError(res);
  }

  // Check content-type:
  if (!helpers.checkContentType(req, 'application/vnd.oada.planting.prescriptions.1+json')) {
    return helpers.contentTypeError(res);
  }

  if (config.verbatim) {
    var generated_id = '02kdfj043';
    res.set('Location', '/resources/02kdfj043/list/'+generated_id);
    res.set('x-oada-rev', '5-89uhjdf9');
    res.set('content-type', 'application/vnd.oada.planting.prescriptions.1+json');
    res.set('etag', 'aabbccddeeffgg');
    return res.send('');
  }
  // Otherwise, respond intelligently: add the new link to the list
  try { 
    var link = JSON.parse(req.body.toString());
  } catch(e) {
    // they messed up the format: wouldn't parse with JSON
    return res.status(406).json({
      'code': '406',
      'status': 'Not Acceptable',
      'href': 'https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0',
      'title': 'Invalid Request Body',
      'detail': 'This POC only accepts resources with Content-Type application/vnd.oada.planting.prescription.1+json.'
               +'For this endpoint, only a single link-style object is accepted.  Your body did not pass JSON.parse.',
      'userMessage': 'Post to master list failed.'
    });
  }

  var err =  helpers.validateAction({ 
    'content-type': req.headers['content-type'], 
     method: 'POST', 
     body: req.body.toString(),
     location: '/bookmarks/planting/prescriptions/list'
  });
  if(err) {
    return helpers.invalidResultingDocument(res, err);
  }

  // Post it to the list:
  var new_id = uuid.v4();
  resources_map[bookmarksid].list[new_id] = link;
  resources_map[bookmarksid] = helpers.updateRev(resources_map[bookmarksid]);
  // Respond with new location and rev:
  res.set('Location', '/resources/'+bookmarksid+'/list/'+new_id);
  res.set('x-oada-rev', resources_map[bookmarksid]._rev);
  res.set('content-type', req.headers['content-type']);
  res.set('etag', md5(JSON.stringify(resources_map[bookmarksid])));
  return res.send('');

});

//////////////////////////////////////////////////////////////
// Step 4: GET _rev on master prescription list to see if it has changed.
// Note that for verbatim mode, it always responds as if it has changed.
app.get('/bookmarks/planting/prescriptions/_rev', function(req, res) {
  console.log('GET /bookmarks/planting/prescriptions/_rev');

  // Check bearer header:
  if (!helpers.checkAuth(req)) {
    return helpers.authError(res);
  }

  if (config.verbatim) {
    res.set('Content-Type', 'application/vnd.oada.planting.prescriptions.1+json');
    res.set('etag', 'hhiijjkkllmmnnoopp');
    res.json({
      _rev: '6-5465asd2'
    });
    return;
  }
  // Otherwise, return the real one:
  res.set('content-type', 'application/vnd.oada.planting.prescriptions.1+json');
  res.send('''+resources_map[bookmarksid]._rev+''');

});

//////////////////////////////////////////////////////////////
// Step 5: GET the master prescription list back to see which
// links have changed:
app.get('/bookmarks/planting/prescriptions', function(req, res) {
  console.log('GET /bookmarks/planting/prescriptions');

  if (!helpers.checkAuth(req)) {
    return helpers.authError(res);
  }

  if (config.verbatim) {
    res.set('Content-Type', 'application/vnd.oada.planting.prescriptions.1+json');
    res.set('etag', 'hhiijjkkllmmnnoopp');
    res.json({
      _id: 'kd85uklsfd',
      _rev: '6-5465asd2',
      _meta: { _metaid: 'kd85uklsfd', _rev: '7-kldjf029i' },
      name: 'prescriptions',
      list: {
        'jf20kjd': { _id: 'jf20kjd', _rev: '2-klsjdf02' },
        '0fjdksl': { _id: '0fjdksl', _rev: '5-kldfj02d' },
        '02kdfj043': { _id: '02kdfj043', _rev: '2-2df32432' }
      }
    });
    return;
  }
  // Otherwise, return the real one:
  res.set('Content-Type', 'application/vnd.oada.planting.prescriptions.1+json');
  res.json(resources_map[bookmarksid]);
});

////////////////////////////////////////////////////////////////
// Step 6: GET the _meta document for the changed prescription
// to check on field reconciliation and transfer status:
app.get('/meta/:rid', function(req, res) {
  console.log('GET /meta/:rid');
  if (!helpers.checkAuth(req)) {
    return helpers.authError(res);
  }

  if(config.verbatim) {
    res.set('Content-Type', 'application/vnd.oada.planting.prescriptions.1+json');
    res.set('etag', 'hhiijjkkllmmnnoopp');
    res.json({
      _metaid: '02kdfj043',
      _rev: '3-kdjf2ojd',
      fields: [
        { _id: 'd30fjrjsd', _rev: '1-dkflj20wi' }
      ],
      transfer_status: {
        '02kdfjl93': {
          machine: { _id: '02kdfjl93', _rev: '195-sklfj02d2' },
          status: 'PENDING'
        }
      }
    });
    return;
  }
  // Otherwise, check if _meta exists for the resource:
  var metaid = req.params.rid;
  if (typeof meta_map[metaid] === 'undefined') {
    return res.status(404).json({
      'code': '404',
      'status': 'Not Found',
      'href': 'https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0',
      'title': 'Meta resource not found.',
      'detail': 'The requested metaid does not exist.',
      'userMessage': 'Failed to check status of resource.'
    });
  }
  // it exists, return it:
  res.set('content-type', 'application/vnd.oada.planting.prescription.1+json');
  res.json(meta_map[metaid]);
});

*/

/////////////////////////////////////////////////////
// Start the server:
if (config.protocol.match(/https/)) {
  var server = https.createServer({
    key: fs.readFileSync('certs/server.key'),
    cert: fs.readFileSync('certs/server.crt'),
  }, app).listen(3000, function () {
    var host = server.address().address;
    if (host === '::') host = 'localhost';
    var port = server.address().port;
    console.log('OADA Mock server listening at https://%s:%s', host, port);
    console.log('CTRL-C to stop');
  });
} else {
  var server = app.listen(3000, function () {
    var host = server.address().address;
    if (host === '::') host = 'localhost';
    var port = server.address().port;
    console.log('OADA Mock server listening at https://%s:%s', host, port);
    console.log('CTRL-C to stop');
  });
}

