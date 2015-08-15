var chai = require('chai');
var chai_as_promised = require('chai-as-promised');
chai.use(chai_as_promised);
var expect = chai.expect;
var _ = require('lodash');
var Promise = require('bluebird');

var config = require('../../config.js');

// Library under test:
var memory_db = require('../../lib/memory-db/memory-db.js')(config);

var cur_resid = 123;

///////////////////////////////////////////////////////////////
// Basic set/get for each database that should exist:
///////////////////////////////////////////////////////////////

describe('memory-db', function() {

  describe('sets followed by gets', function() {
    var path_to_setget = '/' + cur_resid++ + '/a';
    var val_to_setget = { thekey: 'theval' };

    // Note: set runs before get so that 'get' has something to check for
    describe('set', function() {
      it('should allow set(resources,...)', function() {
        var ret = memory_db.set('resources', path_to_setget, val_to_setget);
        return expect(ret).to.eventually.equal(true);
      });
      it('should allow set(parents,...)', function() {
        var ret = memory_db.set('parents', path_to_setget, val_to_setget);
        return expect(ret).to.eventually.equal(true);
      });
      it('should allow set(children,...)', function() {
        var ret = memory_db.set('children', path_to_setget, val_to_setget);
        return expect(ret).to.eventually.equal(true);
      });
      it('should allow set(tokens,...)', function() {
        var ret = memory_db.set('tokens', path_to_setget, val_to_setget);
        return expect(ret).to.eventually.equal(true);
      });
    });
  
    // Must run after set
    describe('get', function() {
      var expected_result = {
        found: true,
        existent_path: path_to_setget,
        nonexistent_path: '',
        val: val_to_setget,
      };

      it('should get(resources,...) ', function() {
        return memory_db.get('resources', path_to_setget)
        .then(function(info) {
          expect(info).to.deep.equal(expected_result);
        });
      });
      it('should get(parents,...)', function() {
        return memory_db.get('parents', path_to_setget)
        .then(function(info) {
          expect(info).to.deep.equal(expected_result);
        });
      });
      it('should get(children,...)', function() {
        return memory_db.get('children', path_to_setget)
        .then(function(info) {
          expect(info).to.deep.equal(expected_result);
        });
      });
      it('should get(tokens,...)', function() {
        return memory_db.get('tokens', path_to_setget)
        .then(function(info) {
          expect(info).to.deep.equal(expected_result);
        });
      });

      it('should return a proper type and length for an object when requested', function() {
        return memory_db.get('resources', path_to_setget, { type_and_length: true })
        .then(function(info) {
          expect(info.type).to.equal('object');
          expect(info.length).to.equal(val_to_setget.length);
        });
      });

      it('should return a proper type and length for an array when requested', function() {
        var arr = [ 'a', 'b' ];
        return memory_db.set('resources', '/1234', arr)
        .then(function() {
          return memory_db.get('resources', '/1234', { type_and_length: true });
        }).then(function(info) {
          expect(info.type).to.equal('array');
          expect(info.length).to.equal(arr.length);
        });
      });

    });
  });

  describe('remove', function() {
    describe('remove an existing path', function() {
      var resource = { a: { b: { c: 'hi c' } } };
      var path_to_set = '/' + cur_resid++;
      var path_to_remove = path_to_set + '/a/b';
      before(function() {
        return memory_db.set('resources', path_to_set, resource);
      });

      it('should successfully remove one of the values from an object', function() {
        return memory_db.remove('resources', path_to_remove)
        .then(function() {
          return memory_db.get('resources', path_to_set);
        }).then(function(info) {
          expect(info).to.deep.equal({
            found: true,
            existent_path: path_to_set,
            nonexistent_path: '',
            val: { a: { } }, // removed /124/a/b
          });
        });
      });
    });

    describe('remove a non-existent path', function() {
      var path_to_remove = '/' + cur_resid++ + '/a/b';

      it('should not throw an exception', function() {
        return expect(memory_db.remove('resources', path_to_remove))
        .to.eventually.be.resolved;
      });
    });

  });


///////////////////////////////////////////////////////////////
// Changing docs
///////////////////////////////////////////////////////////////

describe('changing an existing document', function() {
  var resource = { a: { b: { c: 'the original c' } } };
  var path_to_resource = '/' + cur_resid++;
  // tricky test because d doesn't exist, and 'c' is a string at the moment.
  var path_to_change = path_to_resource + '/a/b/c/d';
  var new_val = { thekey: 'the val' };
  before(function() {
    return memory_db.set('resources', path_to_resource, resource);
  });
  it('should successfully change the value on an object', function()  {
    return memory_db.set('resources', path_to_change, new_val)
    .then(function() {
      return memory_db.get('resources', path_to_resource);
    }).then(function(info) {
      expect(info).to.deep.equal({
        found: true,
        existent_path: path_to_resource,
        nonexistent_path: '',
        val: { a: { b: { c: { d: { thekey: 'the val' } } } } }
      });
    });
  });
});

///////////////////////////////////////////////////////////////
// Separation of returned objects from the database objects
///////////////////////////////////////////////////////////////

describe('separation of objects with clone', function() {
  var val_to_setget = { a: { b: 'a value' } };
  var path_to_setget = '/' + cur_resid++;
  before(function() {
    return memory_db.clean()
    .then(function() {
      return memory_db.set('resources', path_to_setget, val_to_setget);
    });
  });

  it('should set an object, then change the local copy, '
     +'and make sure the db copy has not changed', function() {
    var myval = _.cloneDeep(val_to_setget);
    myval.a.changed_thing = 'the new thing';
    return memory_db.get('resources', path_to_setget)
    .then(function(info) {
      expect(info).to.deep.equal({
        found: true,
        existent_path: path_to_setget,
        nonexistent_path: '',
        val: val_to_setget,
      });
      expect(info.val).to.not.deep.equal(myval);
    });
  });

  it('should not return a clone of the entire resources databse if getting a non-existent resource', function() {
    return memory_db.get('resources', '/anonexistentresource')
    .then(function(info) {
      expect(info).to.deep.equal({
        found: false,
        existent_path: '',
        nonexistent_path: '/anonexistentresource',
        val: null,
      });
    });
  });

});


///////////////////////////////////////////////////////////////
// Simple utilities like uniqueId
///////////////////////////////////////////////////////////////

describe('uniqueId', function() {
  it('should return a string that has some length', function() {
    var id = memory_db.uniqueId();
    expect(id).to.be.a('string');
    expect(id.length).to.be.greaterThan(0);
  });
});


///////////////////////////////////////////////////////////////
// Edge cases for set/get
///////////////////////////////////////////////////////////////

describe('paths with escaped slashes and tildes', function() {
  var path_to_setget = '/' + cur_resid++;
  var val_at_weird_path = 'the value';
  var val_to_setget = { a: { 'b.c/~d/f': val_at_weird_path } };
  var weird_path = path_to_setget + '/a/b.c~1~0d~1f'; // in json-pointer, ~0='~', ~1='/'
  before(function() {
    return memory_db.set('resources', path_to_setget, val_to_setget);
  });

  it('should get back the same resource it put', function() {
    return memory_db.get('resources', path_to_setget)
    .then(function(info) {
      expect(info).to.deep.equal({
        found: true,
        existent_path: path_to_setget,
        nonexistent_path: '',
        val: val_to_setget,
      });
    });
  });

  it("should be able to get just the weird key's value", function() {
    return memory_db.get('resources', weird_path)
    .then(function(info) {
      expect(info).to.deep.equal({
        found: true,
        existent_path: weird_path,
        nonexistent_path: '',
        val: val_at_weird_path,
      });
    });
  });

});


describe('paths without leading slashes', function() {
  var path_to_setget = '' + cur_resid++; // no leading slash
  var val_to_setget = 'hello world';
  var expected_result = {
    found: true,
    existent_path: '/' + path_to_setget, // returned path should always have leading slash
    nonexistent_path: '',
    val: val_to_setget,
  };

  before(function() {
    return memory_db.set('resources', path_to_setget, val_to_setget);
  });
  it('should get back the same thing it set with path missing leading slash', function() {
    return memory_db.get('resources', path_to_setget)
    .then(function(info) {
      expect(info).to.deep.equal(expected_result);
    });
  });
  it('should get back the same thing if it uses the leading slash', function() {
    return memory_db.get('resources', '/' + path_to_setget)
    .then(function(info) {
      expect(info).to.deep.equal(expected_result);
    });
  });
});

});
