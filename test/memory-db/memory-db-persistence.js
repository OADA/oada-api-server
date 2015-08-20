var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var chai = require('chai');
var chai_as_promised = require('chai-as-promised');
chai.use(chai_as_promised);
var expect = chai.expect;
var _ = require('lodash');

var config = require('../../config.js')();

var data_file = 'test-persistent-data.js';

// Library under test:
console.log('requiring persistence..');
var persistence = require('../../lib/memory-db/memory-db-persistence.js')({
  output_file: data_file,
  libs: config.libs, // for config.libs.log()
  forcenew: true,
});


///////////////////////////////////////////////////////////////
// Test saving and loading database
///////////////////////////////////////////////////////////////

describe('memory-db-persistence', function() {

  var test_data = { a: 'val at a', b: 'val at b' };

  before(function() {
    return fs.unlinkAsync(data_file)
    .catch(function(e) {
      // don't care if the file doesn't exist.
    });
  });

  it('should save info.db to a file on dbUpdated', function() {
    return persistence.dbUpdated({ db: test_data })
    .then(function(result) {
      expect(result).to.equal(true);
      // require.main.require requires things relative to the top-level path rather than this file
      return require.main.require(data_file);
    }).then(function(result) {
      expect(result).to.deep.equal(test_data);
    });
  });

  it('should return the proper persistent data on loadFullDb', function() {
    return fs.writeFileAsync(data_file, 'module.exports = ' + JSON.stringify(test_data))
    .then(function() {
      var val = persistence.loadFullDb();
      expect(val).to.deep.equal(test_data);
    });
  });

  after(function() {
    return fs.unlinkAsync(data_file);
  });
});
