var chai = require('chai');
var chai_as_promised = require('chai-as-promised');
chai.use(chai_as_promised);
var expect = chai.expect;
var _ = require('lodash');

var config = require('../config.js');

// Library under test:
var u = require('../lib/oada-util.js')(config);

describe('oada-util', function() {
  describe('isLink', function() {
    it('should fail on null object', function() {
      expect(u.isLink(null)).to.equal(false);
    });
    it('should fail on an empty object', function() {
      expect(u.isLink({})).to.equal(false);
    });
    it('should fail on an empty resource object', function() {
      expect(u.isLink({ 
        _id: '123', 
        _rev: '1-kj20', 
        _meta: { _metaid: '123', _rev: '1-99jf' } 
      })).to.equal(false);
    });
    it('should succeed for non-versioned link', function() {
      expect(u.isLink({ _id: '123' })).to.equal(true);
    });
    it('should succeed for versioned link', function() {
      expect(u.isLink({ _id: '123', _rev: '1-99jf' })).to.equal(true);
    });
    it('should succeed for meta nonversioned link', function() {
      expect(u.isLink({ _metaid: '123' })).to.equal(true);
    });
    it('should succeed for meta versioned link', function() {
      expect(u.isLink({ _metaid: '123', _rev: '1-99jf' })).to.equal(true);
    });
  });

  describe('isVersionedLink', function() {
    it('should fail on null object', function() {
      expect(u.isVersionedLink(null)).to.equal(false);
    });
    it('should fail on an empty object', function() {
      expect(u.isVersionedLink({})).to.equal(false);
    });
    it('should fail on an empty resource object', function() {
      expect(u.isVersionedLink({ 
        _id: '123', 
        _rev: '1-kj20', 
        _meta: { _metaid: '123', _rev: '1-99jf' } 
      })).to.equal(false);
    });
    it('should fail for non-versioned link', function() {
      expect(u.isVersionedLink({ _id: '123' })).to.equal(false);
    });
    it('should succeed for versioned link', function() {
      expect(u.isVersionedLink({ _id: '123', _rev: '1-99jf' })).to.equal(true);
    });
    it('should fail for meta nonversioned link', function() {
      expect(u.isVersionedLink({ _metaid: '123' })).to.equal(false);
    });
    it('should succeed for meta versioned link', function() {
      expect(u.isVersionedLink({ _metaid: '123', _rev: '1-99jf' })).to.equal(true);
    });
  });

  describe('isMetaLink', function() {
    it('should fail on null object', function() {
      expect(u.isMetaLink(null)).to.equal(false);
    });
    it('should fail on an empty object', function() {
      expect(u.isMetaLink({})).to.equal(false);
    });
    it('should fail on an empty resource object', function() {
      expect(u.isMetaLink({ 
        _id: '123', 
        _rev: '1-kj20', 
        _meta: { _metaid: '123', _rev: '1-99jf' } 
      })).to.equal(false);
    });
    it('should fail for non-versioned link', function() {
      expect(u.isMetaLink({ _id: '123' })).to.equal(false);
    });
    it('should fail for versioned link', function() {
      expect(u.isMetaLink({ _id: '123', _rev: '1-99jf' })).to.equal(false);
    });
    it('should fail for meta nonversioned link', function() {
      expect(u.isMetaLink({ _metaid: '123' })).to.equal(false);
    });
    it('should fail for a meta versioned link which also has an _id', function() {
      expect(u.isMetaLink({ _metaid: '123', _rev: '1-99jf', _id: 'meta:123' })).to.equal(false);
    });
    it('should succeed for meta versioned link', function() {
      expect(u.isMetaLink({ _metaid: '123', _rev: '1-99jf' })).to.equal(true);
    });
  });

  describe('.parseContentType', function() {
    it('should get the content type from a request-like object', function() {
      var type = 'application/vnd.oada.test.1+json';
      expect(u.parseContentType({ headers: { 'content-type': type + ' ;charset=utf8' } }))
      .to.equal(type);
    });
  });

});
