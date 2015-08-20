var chai = require('chai');
var chai_as_promised = require('chai-as-promised');
chai.use(chai_as_promised);
var expect = chai.expect;
var _ = require('lodash');

var config = require('../../config.js')();

var db = config.libs.db.db();

// Library under test:
var driver = require('../../lib/memory-db/memory-db-resources-driver.js')(config);

var cur_resid = 234;

describe('memory-db-resources-driver', function() {

  /////////////////////////////////////////////////////////////////////////
  // GET tests
  /////////////////////////////////////////////////////////////////////////

  describe('.get', function() {
    var path1 = '/' + cur_resid++
    var linked_resourceid = cur_resid++;
    var path2 = '/' + linked_resourceid;
    var val1 = { normalkey: 'normalval', thelink: { _id: linked_resourceid } };
    var val2 = { hello: 'world', 'weirdkey.abc.2/4+5/6kf~j': 'weirdval' };
    var weirdkey_escaped = 'weirdkey.abc.2~14+5~16kf~0j'; // json-pointer: ~0 = ~, ~1 = /
    before(function() {
      return db.set('resources', path1, val1)
      .then(function() {
        return db.set('resources', path2, val2)
      });
    });
    
    it('should get a normal resource successfully', function() {
      return driver.get(path2)
      .then(function(info) {
        expect(info).to.deep.equal({
          found: true,
          existent_path: path2,
          nonexistent_path: '',
          val: val2,
        });
      });
    });

    it('should get a path into a normal resource sucessfully', function() {
      return driver.get(path1 + '/normalkey')
      .then(function(info) {
        expect(info).to.deep.equal({
          found: true,
          existent_path: path1 + '/normalkey',
          nonexistent_path: '',
          val: val1.normalkey,
        });
      });
    });

    it('should follow a link if link is at end of a path', function() {
      return driver.get(path1 + '/thelink')
      .then(function(info) {
        expect(info).to.deep.equal({
          found: true,
          existent_path: path2,
          nonexistent_path: '',
          val: val2
        });
      });
    });

    it('should get a path inside a linked resource if path has link in it', function() {
      return driver.get(path1 + '/thelink/hello')
      .then(function(info) {
        expect(info).to.deep.equal({
          found: true,
          existent_path: path2 + '/hello', // the path should be the one rooted at the linked resource
          nonexistent_path: '',
          val: val2.hello,
        });
      });
    });

    it('should get a linked key with json-pointer escaped characters in it', function() {
      return driver.get(path1 + '/thelink/' + weirdkey_escaped)
      .then(function(info) {
        expect(info).to.deep.equal({
          found: true,
          existent_path: path2 + '/' + weirdkey_escaped,
          nonexistent_path: '',
          val: val2['weirdkey.abc.2/4+5/6kf~j'],
        });
      });
    });
  });



  /////////////////////////////////////////////////////////////////////////
  // PUT tests
  /////////////////////////////////////////////////////////////////////////

  var checkResourceAndMeta = function(resourceid, plain_obj, plain_meta) {
    resourceid = '' + resourceid; // coerce to string
    return driver.get('/' + resourceid)
    // Check the resource itself:
    .then(function(info) {
      expect(info.found).to.equal(true);
      expect(info.existent_path).to.equal('/'+resourceid);
      expect(info.nonexistent_path).to.equal('');
      expect(info.val).to.contain.keys([ '_id', '_rev', '_meta' ]);
      expect(info.val._id).to.equal(resourceid);
      expect(info.val._meta).to.contain.keys( ['_metaid', '_rev'] );
      expect(info.val._meta._metaid).to.equal(resourceid);
      var predictable_val = _.cloneDeep(info.val);
      delete predictable_val._id;
      delete predictable_val._rev;
      delete predictable_val._meta;
      expect(predictable_val).to.deep.equal(plain_obj);
      return driver.get('/meta:' + resourceid);
    // Check the meta for the resource:
    }).then(function(info) {
      expect(info.found).to.equal(true);
      expect(info.existent_path).to.equal('/meta:'+resourceid);
      expect(info.nonexistent_path).to.equal('');
      expect(info.val).to.contain.keys([ '_metaid', '_rev', '_mediaType' ]);
      expect(info.val._metaid).to.equal(resourceid);
      var predictable_val = _.cloneDeep(info.val);
      delete predictable_val._metaid;
      delete predictable_val._rev;
      expect(predictable_val).to.deep.equal(plain_meta);
    });
  };

  describe('.put', function() {
    describe('#create resources', function() {
      it('should fail if creating a resource with no _mediaType', function() {
        var resourceid = '' + cur_resid++;
        return expect(driver.put('/' + resourceid, { }))
        .to.eventually.be.rejected;
      });
      it('should create one resource with a nonexistent resource id', function() {
        var resourceid = '' + cur_resid++;
        var val = { 'newkey': 'this is a new resource' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.put('/' + resourceid, val, opts)
        .then(function(info) {
          expect(info._id).to.equal(resourceid);
          return checkResourceAndMeta(resourceid, val, opts._meta);
        });
      });

      it('should return a proper info object', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { };
        return driver.put(path, val, opts)
        .then(function(info) {
          expect(info).to.deep.equal({
            _id: resourceid,
            path: path,
          });
        });
      });

      it('should create a resource with a nonexistent path to inside the resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid + '/a/b';
        var val = { 'newkey': 'this is a new resource' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.put(path, val, opts)
        .then(function(info) {
          expect(info._id).to.equal(resourceid);
          return checkResourceAndMeta(resourceid, { a: { b: val } }, opts._meta)
        });
      });

      it('should fail on PUT at /resources level', function() {
        return expect(driver.put('', {})).to.eventually.be.rejected;
      });

      it('should ignore explicitly wrong values when creating an object for _id, _rev, and _meta', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = {
          _id: 'thisisthewrongid',
          _rev: '0-thisisthewrongrev',
          _meta: { _metaid: 'thisisthewrongmetaid', _rev: '0-thisisthewrongmetarev' },
        };
        return driver.put(path, val, opts)
        .then(function(info) {
          expect(info._id).to.equal(resourceid);
          return checkResourceAndMeta(resourceid, {}, opts._meta);
        }).then(function() {
          return driver.get(path);
        }).then(function(info) {
          expect(info.val._id).to.not.equal(val._id);
          expect(info.val._rev).to.not.equal(val._rev);
          expect(info.val._meta).to.not.equal(val._meta);
        });
      });

    });


    describe('#change existing resources', function() {

      it('should change one resource with direct path to resource (no links)', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var val = { 'thekey': 'theval' };
        var new_val = { 'thekey': 'thenewval' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.put(path, val, opts) // creates the resource
        .then(function(info) {
          return driver.put(path, new_val); // modifies 'thekey' during merge
        }).then(function(info) {
          return checkResourceAndMeta(resourceid, new_val, opts._meta);
        });
      });

      it('should change one resource with direct path to inside resource (no links)', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid + '/a';
        var val = { thekey: 'theval' } ;
        var new_val = { thekey: 'thenewval' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.put(path, val, opts) // creates the resource and the 'a' key
        .then(function(info) {
          return driver.put(path, new_val); // modifies 'thekey' during merge
        }).then(function(info) {
          return checkResourceAndMeta(resourceid, { a: new_val }, opts._meta);
        });
      });

      it('should change a link in a resource if at the end of a path', function() {
        var resourceid1 = '' + cur_resid++;
        var resourceid2 = '' + cur_resid++;
        var resourceid3 = '' + cur_resid++;
        var path1 = '/' + resourceid1;
        var path2 = '/' + resourceid2;
        var path3 = '/' + resourceid3;
        var val1 = { thelink: { _id: resourceid2 } };
        var val2 = { hello: 'world' };
        var val3 = { goodbye: 'world' };
        var new_val1 = { thelink: { _id: resourceid3 } };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return Promise.all([
          driver.put(path1, val1, opts), // creates the resource
          driver.put(path2, val2, opts), // creates the resource
          driver.put(path3, val3, opts), // creates the resource
        ]).then(function() {
          return driver.put(path1, new_val1); // modifies 'thelink' during merge
        }).then(function(link) {
          return checkResourceAndMeta(resourceid1, new_val1, opts._meta);
        }).then(function() {
          return driver.get(path1 + '/thelink');
        }).then(function(info) {
          expect(info.val.goodbye).to.equal('world');
        });

      });

      it('should properly set the _rev on a versioned link in a document', function() {
        var resourceid1 = '' + cur_resid++;
        var resourceid2 = '' + cur_resid++;
        var path1 = '/' + resourceid1;
        var path2 = '/' + resourceid2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'val1' } ;
        var val2 = { theversionedlink: { _id: resourceid1, _rev: '0-0' }, };
        var rev1;

        // First, create resource 1:
        return driver.put(path1, val1, opts)
        // Then, record resource1's _rev and create reource 2.  resource2's link to resource1
        // should have it's _rev updated to the current _rev for resource1 after the put.
        .then(function(info) { 
          return driver.get(path1 + '/_rev');
        }).then(function(info) {
          rev1 = info.val;
          return driver.put(path2, val2, opts);
        // Get resource 2 back and see if the link has been updated:
        }).then(function() {
          return driver.get(path2);
        }).then(function(info) {
          expect(info.val.theversionedlink._rev).to.equal(rev1);
        });

      });

      it('should not allow changing the _rev in a versioned link because it should follow the link to the resource', function() {
        var resourceid1 = '' + cur_resid++;
        var resourceid2 = '' + cur_resid++;
        var path1 = '/' + resourceid1;
        var path2 = '/' + resourceid2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'val1' } ;
        var val2 = { theversionedlink: { _id: resourceid1, _rev: '0-0' }, };
        var rev1;
        // First, create resource 1:
        return driver.put(path1, val1, opts)
        // Then, record resource1's _rev and create reource 2.  resource2's link to resource1
        // should have it's _rev updated to the current _rev for resource1 after the put.
        .then(function(info) { 
          return driver.get(path1 + '/_rev');
        }).then(function(info) {
          rev1 = info.val;
          return driver.put(path2, val2, opts);
        // Now try to change the _rev on the document:
        }).then(function(info) {
          return expect(driver.put(path2 + '/theversionedlink/_rev', '9-9'))
          .to.be.rejected;
        // Now get the link back and make sure it's the same as it was in rev1:
        }).then(function() {
          return driver.get(path2 + '/theversionedlink/_rev');
        }).then(function(info) {
          expect(info.val).to.equal(rev1);
        });
      });

      it('should correctly change a resource with linked path to top of resource', function() {
        var resourceid1 = '' + cur_resid++;
        var resourceid2 = '' + cur_resid++;
        var path1 = '/' + resourceid1;
        var path2 = '/' + resourceid2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'the original value' } ;
        var val2 = { theversionedlink: { _id: resourceid1, _rev: '0-0' }, };
        var new_val = { key1: "the new value" };
        var new_resource1 = _.cloneDeep(val1);
        new_resource1.key1 = new_val.key1;
        // First, create resource 1:
        return driver.put(path1, val1, opts)
        .then(function(info) { 
          return driver.put(path2, val2, opts);
        // Now try to change doc1 through the link in doc2:
        }).then(function(info) {
          return driver.put(path2 + '/theversionedlink', new_val);
        // Now get the link back and make sure it's the same as it was in rev1:
        }).then(function() {
          return checkResourceAndMeta(resourceid1, new_resource1, opts._meta);
        });
      });

      it('should correctly change a resource with linked path to inside resource', function() {
        var resourceid1 = '' + cur_resid++;
        var resourceid2 = '' + cur_resid++;
        var path1 = '/' + resourceid1;
        var path2 = '/' + resourceid2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'the original value' } ;
        var val2 = { theversionedlink: { _id: resourceid1, _rev: '0-0' }, };
        var new_val = "the new value";
        var new_resource1 = _.cloneDeep(val1);
        new_resource1.key1 = new_val;
        // First, create resource 1:
        return driver.put(path1, val1, opts)
        .then(function(info) { 
          return driver.put(path2, val2, opts);
        // Now try to change doc1 through the link in doc2:
        }).then(function(info) {
          return driver.put(path2 + '/theversionedlink/key1', new_val);
        // Now get the link back and make sure it's the same as it was in rev1:
        }).then(function() {
          return checkResourceAndMeta(resourceid1, new_resource1, opts._meta);
        });
      });

      it('should merge an object with existing keys', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { key1: 'key1 val', key2: 'key2 original val' };
        var new_val = { key2: 'key2 changed val', key3: 'key3 new val' };
        var expected_val = _.cloneDeep(val);
        expected_val.key2 = new_val.key2;
        expected_val.key3 = new_val.key3;
        return driver.put(path, val, opts)
        .then(function(info) {
          return driver.put(path, new_val);
        }).then(function(info) {
          return checkResourceAndMeta(resourceid, expected_val, opts._meta);
        });
      });

      it('should allow a versioned link to a non-existent resource, and set the _rev to 0-0', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { versionedlink: { _id: 'doesnotexist'+resourceid, _rev: '9-9' } };
        var expected_val = _.cloneDeep(val);
        expected_val.versionedlink._rev = '0-0';
        return driver.put(path, val, opts)
        .then(function(info) {
          return checkResourceAndMeta(resourceid, expected_val, opts._meta);
        });
      });

    });

    describe('#reserved keys', function() {

      it('should ignore _id, _metaid, and _rev in objects that have non-link keys', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var val = { thelink: { _id: resourceid, _metaid: 'bad stuff', _rev: 'not valid rev', notreallyalink: true, } };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var expected_val = _.cloneDeep(val);
        delete expected_val.thelink._id;
        delete expected_val.thelink._metaid;
        delete expected_val.thelink._rev;
        return driver.put(path, val, opts)
        .then(function(info) {
          return checkResourceAndMeta(resourceid, expected_val, opts._meta);
        });
      });

      it('should not allow PUTing /resid/_id directly on an existing resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid+'/_id';
        var val = 'notavalidresourceid';
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return expect(driver.put(path, val, opts))
        .to.be.rejected;
      });

      it('should not allow PUTing /resid/_metaid on an existing resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid+'/_metaid';
        var val = 'notavalidmetaid';
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return expect(driver.put(path, val, opts))
        .to.be.rejected;
      });

      it('should not allow PUTing /resid/_rev on an existing resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid+'/_rev';
        var val = 'notavalidrev';
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return expect(driver.put(path, val, opts))
        .to.be.rejected;
      });

      it('should allow PUTing a value to /resid/_meta directly since the value should go in the meta resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/'+resourceid+'/_meta';
        var val = { newkey: 'new val' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.put(path, val, opts)
        .then(function(info) {
          return driver.get(path);
        }).then(function(info) {
          expect(info.found).to.equal(true);
          expect(info.val.newkey).to.equal(val.newkey);
        });
      });


      it('should ignore explicitly wrong values when PUTting to an existing resource for _id, _rev, and _meta', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { };
        var new_val = {
          _id: 'thisisthewrongid',
          _rev: '0-thisisthewrongrev',
          _meta: { _metaid: 'thisisthewrongmetaid', _rev: '0-thisisthewrongmetarev' },
          thenewkey: 'thenewval',
        };
        return driver.put(path, val, opts) // create the resource
        .then(function(info) {
          return driver.put(path, new_val, opts);
        }).then(function(info) {
          return checkResourceAndMeta(resourceid, { thenewkey: 'thenewval' }, opts._meta);
        }).then(function() {
          return driver.get(path);
        }).then(function(info) {
          expect(info.val._id).to.not.equal(val._id);
          expect(info.val._rev).to.not.equal(val._rev);
          expect(info.val._meta).to.not.equal(val._meta);
        });
      });

    });

  });



  /////////////////////////////////////////////////////////////////////////
  // POST tests
  /////////////////////////////////////////////////////////////////////////

  describe('post', function() {
    describe('#create resources', function() {

      it('should fail if creating a resource with no _mediaType', function() {
        return expect(driver.post('/', { }))
        .to.eventually.be.rejected;
      });

      it('should return a valid info object with the right keys', function() {
        var val = { 'newkey': 'this is a new resource' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.post('/', val, opts)
        .then(function(info) {
          expect(info._id).to.be.defined;
          expect(info.path).to.equal('/' + info._id);
          expect(info.key_created).to.equal(info._id);
        });
      });

     it('should create a valid empty resource if passed an empty object to POST', function() {
       var resourceid;
       var path;
       var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
       return driver.post('/', { }, opts)
       .then(function(info) {
         resourceid = info._id;
         path = '/' + resourceid;
         return checkResourceAndMeta(resourceid, { }, opts._meta);
       });
     });

      it('should create one resource when posting to top level', function() {
        var val = { 'newkey': 'this is a new resource' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.post('/', val, opts)
        .then(function(info) {
          return checkResourceAndMeta(info._id, val, opts._meta);
        });
      });

      it('should create a resource with a nonexistent path to inside the resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid + '/a/b';
        var val = { 'newkey': 'this is a new resource' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.post(path, val, opts)
        .then(function(info) {
          expect(info._id).to.equal(resourceid);
          var expected_val = { a: { b: {}, }, };
          expected_val.a.b[info.key_created] = _.cloneDeep(val);
          return checkResourceAndMeta(resourceid, expected_val, opts._meta)
        });
      });

      it('should ignore explicitly wrong values when creating an object for _id, _rev, and _meta', function() {
        var resourceid;
        var path = '/';
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = {
          _id: 'thisisthewrongid',
          _rev: '0-thisisthewrongrev',
          _meta: { _metaid: 'thisisthewrongmetaid', _rev: '0-thisisthewrongmetarev' },
        };
        return driver.post(path, val, opts)
        .then(function(info) {
          resourceid = info._id;
          return checkResourceAndMeta(resourceid, {}, opts._meta);
        }).then(function() {
          return driver.get(path+resourceid);
        }).then(function(info) {
          expect(info.val._id).to.not.equal(val._id);
          expect(info.val._rev).to.not.equal(val._rev);
          expect(info.val._meta).to.not.equal(val._meta);
        });
      });

      it('should replace a string with an object when string is posted to', function() {
        var resourceid;
        var path;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var orig_val = { key: 'astring' };
        var new_val = 'posted thing';
        var key_created;
        return driver.post('/', orig_val, opts)
        .then(function(info) {
          resourceid = info._id;
          path = '/' + resourceid;
          return driver.post(path + '/key', new_val, opts);
        }).then(function(info) {
          key_created = info.key_created;
          return driver.get(path);
        }).then(function(info) {
          expect(info.val.key[key_created]).to.equal(new_val);
        });

      });

    });

    describe('#links in paths', function() {

      it('should properly set the _rev when posting a versioned link to a document', function() {
        var resourceid1;
        var resourceid2;
        var path1;
        var path2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'val1' } ;
        var val2 = { theversionedlink: { _id: null, _rev: '0-0' }, };
        var rev1;

        // First, create resource 1:
        return driver.post('/', val1, opts)
        // Then, record resource1's _rev and create reource 2.  resource2's link to resource1
        // should have it's _rev updated to the current _rev for resource1 after the put.
        .then(function(info) { 
          resourceid1 = info._id;
          return driver.get('/'+resourceid1+'/_rev');
        }).then(function(info) {
          rev1 = info.val; 
          path1 = '/' + resourceid1;
          val2.theversionedlink._id = resourceid1;
          return driver.post('/', val2, opts);
        // Get resource 2 back and see if the link has been updated:
        }).then(function(info) {
          resourceid2 = info._id;
          path2 = '/' + resourceid2;
          return driver.get(path2);
        }).then(function(info) {
          expect(info.val.theversionedlink._rev).to.equal(rev1);
        });

      });

      it('should add to a linked resource if link is at the end of a path', function() {
        var resourceid1;
        var resourceid2;
        var path1;
        var path2;
        var val1 = { thelink: { _id: null } };
        var val2 = { hello: 'world' };
        var val3 = { goodbye: 'mars' };
        var expected_val;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        return driver.post('/', val2, opts) // creates the resource
        .then(function(info) {
          resourceid2 = info._id;
          path2 = '/' + resourceid2;
          val1.thelink._id = resourceid2;
          return driver.post('/', val1, opts);
        }).then(function(info) {
          resourceid1 = info._id;
          path1 = '/' + resourceid1;
          return driver.post(path1+'/thelink', val3, opts); // path ends with link to resource2
        }).then(function(info) {
          expected_val = _.cloneDeep(val2);
          expected_val[info.key_created] = val3;
          return driver.get(path2);
        }).then(function(info) {
          return checkResourceAndMeta(resourceid2, expected_val, opts._meta);
        });

      });

      it('should add to a linked resource if link is in middle of path', function() {
        var resourceid1;
        var resourceid2;
        var path1;
        var path2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'the original value', key2: { },  };
        var val2 = { theversionedlink: { _id: null, _rev: '0-0' }, };
        var new_val = "the new value";
        var expected_val;
        // First, create resource 1:
        return driver.post('/', val1, opts)
        .then(function(info) { 
          resourceid1 = info._id;
          path1 = '/' + resourceid1;
          val2.theversionedlink._id = resourceid1;
          return driver.post('/', val2, opts);
        // Now try to change doc1 through the link in doc2:
        }).then(function(info) {
          resourceid2 = info._id;
          path2 = '/' + resourceid2;
          return driver.post(path2 + '/theversionedlink/key2', new_val);
        // Now get the link back and make sure it's the same as it was in rev1:
        }).then(function(info) {
          expected_val = _.cloneDeep(val1);
          expected_val.key2[info.key_created] = new_val;
          return checkResourceAndMeta(resourceid1, expected_val, opts._meta);
        });
      });

      it('should allow a versioned link to a non-existent resource, and set the _rev to 0-0', function() {
        var resourceid;
        var path;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { versionedlink: { _id: 'doesnotexist', _rev: '9-9' } };
        var expected_val = _.cloneDeep(val);
        expected_val.versionedlink._rev = '0-0';
        return driver.post('/', val, opts)
        .then(function(info) {
          return checkResourceAndMeta(info._id, expected_val, opts._meta);
        });
      });

    });

    describe('#reserved keys', function() {

      it('should ignore _id, _metaid, and _rev in objects that have non-link keys', function() {
        var resourceid;
        var path;
        var val = { thelink: { _id: '123456789', _metaid: 'bad stuff', _rev: 'not valid rev', notreallyalink: true, } };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var expected_val = _.cloneDeep(val);
        delete expected_val.thelink._id;
        delete expected_val.thelink._metaid;
        delete expected_val.thelink._rev;
        return driver.post('/', val, opts)
        .then(function(info) {
          return checkResourceAndMeta(info._id, expected_val, opts._meta);
        });
      });

      it('should allow POSTing a value to /resid/_meta directly since the value should go in the meta resource', function() {
        var resourceid;
        var path;
        var val = { newkey: 'new val' };
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var key_created;
        return driver.post('/', {}, opts)
        .then(function(info) {
          resourceid = info._id;
          path = '/' + resourceid +'/_meta';
          return driver.post(path, val);
        }).then(function(info) {
          key_created = info.key_created;
          return driver.get(path);
        }).then(function(info) {
          expect(info.found).to.equal(true);
          expect(info.val[key_created].newkey).to.equal(val.newkey);
        });
      });

      it('should ignore explicitly wrong reserved key values when POSTing to /resources', function() {
        var resourceid;
        var path;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = {
          _id: 'thisisthewrongid',
          _rev: '0-thisisthewrongrev',
          _meta: { _metaid: 'thisisthewrongmetaid', _rev: '0-thisisthewrongmetarev' },
          thenewkey: 'thenewval',
        };
        return driver.post('/', val, opts) // create the resource
        .then(function(info) {
          resourceid = info._id;
          path = '/' + resourceid;
          return checkResourceAndMeta(resourceid, { thenewkey: val.thenewkey }, opts._meta);
        }).then(function() {
          return driver.get(path);
        }).then(function(info) {
          expect(info.val._id).to.not.equal(val._id);
          expect(info.val._rev).to.not.equal(val._rev);
          expect(info.val._meta).to.not.equal(val._meta);
        });
      });

    });

  });



  /////////////////////////////////////////////////////////////////////////
  // DELETE tests
  /////////////////////////////////////////////////////////////////////////

  describe('.delete', function() {

    describe('#simple resources', function() {

      it('should delete a simple key from a resource', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { key1: 'val1', key2: 'val2' };
        var expected_value = _.cloneDeep(val);
        return driver.put(path, val, opts)
        .then(function(info) {
          delete expected_value.key1;
          return driver.delete(path + '/key1')
        }).then(function(info) {
          return checkResourceAndMeta(resourceid, expected_value, opts._meta);
        });
      });

      it('should successfully delete an entire resoruce', function() {
        var resourceid = '' + cur_resid++;
        var path = '/' + resourceid;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val = { key1: 'val1', key2: 'val2' };
        return driver.put(path, val, opts)
        .then(function(info) {
          return driver.delete(path);
        }).then(function(info) {
          return driver.get(path);
        }).then(function(info) {
          expect(info.found).to.equal(false);
          expect(info.existent_path).to.equal('');
        });

      });

      it('should fail when deleting /resources', function() {
        return expect(driver.delete('/'))
        .to.eventually.be.rejected;
      });

    });

    describe('#links', function() {
      it('should remove a link in an object', function() {
        var resourceid1;
        var resourceid2;
        var path1;
        var path2;
        var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST+json' } };
        var val1 = { key1: 'val1' } ;
        var val2 = { theversionedlink: { _id: null, _rev: '0-0' }, };
        var rev1;
        // First, create resource 1:
        return driver.post('/', val1, opts)
        // Then, record resource1's _rev and create reource 2.  resource2's link to resource1
        // should have it's _rev updated to the current _rev for resource1 after the put.
        .then(function(info) { 
          resourceid1 = info._id;
          return driver.get('/'+resourceid1+'/_rev');
        }).then(function(info) {
          rev1 = info.val; 
          path1 = '/' + resourceid1;
          val2.theversionedlink._id = resourceid1;
          return driver.post('/', val2, opts);
        // Delete the link
        }).then(function(info) {
          resourceid2 = info._id;
          path2 = '/' + resourceid2;
          return driver.delete(path2 + '/theversionedlink');
        }).then(function() {
          var expected_val = _.cloneDeep(val2);
          delete expected_val.theversionedlink;
          return checkResourceAndMeta(resourceid2, expected_val, opts._meta);
        }).then(function() {
          return checkResourceAndMeta(resourceid1, val1, opts._meta);
        });

      });
    });

  });


  ////////////////////////////////////////////////////////////////////////
  // Misc tests
  ////////////////////////////////////////////////////////////////////////
  describe('.resourceIdForPath', function() {
    it('should return the right resourceid for a valid path', function() {
      var resid = driver.resourceidForPath('/123/a/b');
      expect(resid).to.equal('123');
    });
    it('should return null for an empty path', function() {
      var resid = driver.resourceidForPath();
      expect(resid).to.equal(null);
    });
  });
});
