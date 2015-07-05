var expect = require('chai').expect;
var request = require('request-promise');
var _ = require('lodash');

var oada_util = require('../lib/oada-util.js');
var config = require('../config.js');
var setup = require('../dbsetups/simple.js');

var host = 'http://localhost:'+config.port+'/';

var opts = function(mergeobj) {
  return _.merge({
    uri: host,
    resolveWithFullResponse: true,
    headers: {
      'authorization': 'Bearer ' + config.auth.token,
      'content-type': setup.meta._mediaType,
    },
    simple: false
  }, mergeobj);
}

var checkResourceAndMeta = function(resourceid, expected_val, expected_meta) {
  return request.get(opts({
    uri: host + 'resources/' + resourceid,
  })).then(function(result) {
    expect(result.statusCode).to.equal(200);
    expect(oada_util.parseContentType(result).toLowerCase()).to.equal(expected_meta._mediaType.toLowerCase());
    var val = JSON.parse(result.body);
    expect(val._id).to.equal(resourceid);
    expect(val._rev).to.match(/^[0-9]+-.+$/);
    expect(oada_util.isVersionedLink(val._meta)).to.equal(true);
    expect(val._meta._metaid).to.equal(resourceid);
    expect(val._meta._rev).to.match(/^[0-9]+-.+$/);
    var clean_val = _.cloneDeep(val);
    delete clean_val._id;
    delete clean_val._rev; // rest should match
    delete clean_val._meta; // rest should match
    expect(clean_val).to.deep.equal(expected_val);
    return request.get(opts({
      uri: host + 'meta/' + resourceid,
    }));
  }).then(function(result) {
    expect(result.statusCode).to.equal(200);
    expect(oada_util.parseContentType(result).toLowerCase()).to.equal(expected_meta._mediaType.toLowerCase());
    var val = JSON.parse(result.body);
    expect(val._metaid).to.equal(resourceid);
    expect(val._rev).to.match(/^[0-9]+-.+$/);
    var clean_val = _.cloneDeep(val);
    delete clean_val._metaid;
    delete clean_val._rev; // rest should match
    expect(clean_val).to.deep.equal(expected_meta);
  });
};

var cur_resid = 1000;

describe('server tests for simple setup (server must be running!)', function() {
  
  describe('.get', function() {
    it('should be able to get the dummy resource and its /meta', function() {
      var expected_val = _.cloneDeep(setup.resource);
      delete expected_val._id;
      return checkResourceAndMeta(setup.resource._id, expected_val, setup.meta);
    });

    it('should be able to get /bookmarks and it\'s /meta', function() {
      return request.get(opts({
        uri: host + 'bookmarks',
      }))
      .then(function(result) {
        var expected_val = {};
        return checkResourceAndMeta(setup.bookmarksid, expected_val, setup.meta);
      });
    });

  });

  describe('.put', function() {
    it('should be able to put a new resource then get it back', function() {
      var resourceid = '' + cur_resid++;
      var val = { a: 'val a', b: 'val b' };
      return request.put(opts({
        uri: host + 'resources/' + resourceid,
        body: JSON.stringify(val),
      })).then(function(result) {
        return checkResourceAndMeta(resourceid, val, { _mediaType: setup.meta._mediaType });
      });
    });
  });

  describe('.post', function() {
    var resourceid;
    var val = { c: 'val c', d: 'val d' };
    it('should be able to POST a new resource, then get it back', function() {
      return request.post(opts({
        uri: host + 'resources',
        body: JSON.stringify(val),
      })).then(function(result) {
        resourceid = result.headers['content-location']
                     .replace(/\/resources\/([^\/]+).*/, '$1');
        return checkResourceAndMeta(resourceid, val, { _mediaType: setup.meta._mediaType });
      });
    });
  });

  describe('.delete', function() {
    var resourceid = '' + cur_resid++;
    var val = { e: 'val e', f: 'val f' };
    it('should be able to PUT a resource, then delete a value '
      +'from it, then get the changed one back', function() {
      return request.put(opts({
        uri: host + 'resources/' + resourceid,
        body: JSON.stringify(val),
      })).then(function(result) {
        return request(opts({
          method: 'DELETE',
          uri: host + 'resources/' + resourceid + '/f',
        }));
      }).then(function(result) {
        var expected_val = _.cloneDeep(val);
        delete expected_val.f;
        return checkResourceAndMeta(resourceid, expected_val, { _mediaType: setup.meta._mediaType });
      });
    });
  });

  describe('#rev updating', function() {

    it('should update the rev on a document after changing it, '
      +'given a reasonable delay', function() {
      var resourceid = '' + cur_resid++;
      var val = { g: 'val g', h: 'val h' };
      var new_val = { i: 'val i' };
      return request.put(opts({
        uri: host + 'resources/' + resourceid,
        body: JSON.stringify(val),
      })).then(function(result) {
        return request.put(opts({
          uri: host + 'resources/' + resourceid,
          body: JSON.stringify(new_val),
        }));
      }).delay(1000)
      .then(function() {
        var expected_val = _.merge(val, new_val);
        return checkResourceAndMeta(resourceid, expected_val, { _mediaType: setup.meta._mediaType });
      }).then(function() {
        return request.get(opts({
          uri: host + 'resources/' + resourceid + '/_rev',
        }));
      }).then(function(result) {
        var _rev = JSON.parse(result.body);
        var inc_part = _rev.split('-')[0];
        expect(+inc_part).to.be.greaterThan(0);
      });
    });

  });

});
