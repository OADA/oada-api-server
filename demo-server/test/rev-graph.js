var expect = require('chai').expect;

var rg = require('../lib/rev-graph.js');
var db = require('../lib/memory-db-resources-driver.js');

var cur_resid = 123;

describe('rev-graph', function() {

  describe('.incrementRevString', function() {
    it('should increment 0-0 to 1-something', function() {
      expect(rg.incrementRevString('0-0')).to.match(/^1-.+$/);
    });
    it('should return 1-something if no string is passed', function() {
      expect(rg.incrementRevString()).to.match(/^1-.+$/);
    });
  });

  describe('.addParentChildRelationship', function() {
    it('should add a childid and parentid with a path', function() {
      var childid  = '' + cur_resid++;
      var parentid = '' + cur_resid++;
      throw new Error('write the test');
    });
  });

  describe('.queueUpdateParents', function() {
    it('should have a test', function() {
      throw new Error('write the test');
    });
  });

  describe('.removeParentChildRelationship', function() {
    it('should have a test', function() {
      throw new Error('write the test');
    });
  });

  describe('.start', function() {
    it('should have a test', function() {
      throw new Error('write the test');
    });
  });

});
