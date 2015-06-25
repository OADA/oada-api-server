var Promise = require('bluebird');
var rwlock = require('rwlock');

// This just wraps the rwlock library with promises.  PromisifyAll didn't do the trick.

var _RWLockPromise = function() {
  return {
    lock: new rwlock(),
    timeout: 5000, // locks timeout in 5 seconds, unless you change this.

    readLock: function(lockid) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var opts = {
          timeout: self.timeout, // Lock will reject promise in 5 seconds if not acquired
          timeoutCallback: function() {
            return reject(new Error('Request for readLock timed out for lock ' + lockid));
          },
        };
  
        self.lock.readLock(lockid, function(release) {
          resolve(release);
        },opts);
  
      });
    },

    writeLock: function(lockid) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var opts = {
          timeout: self.timeout,
          timeoutCallback: function() {
            reject(new Error('Request for writeLock timed out for lock ' + lockid));
          },
        };
  
        self.lock.writeLock(lockid, function(release) {
          resolve(release);
        });
  
      });
    },

  };
};

module.exports = _RWLockPromise;

