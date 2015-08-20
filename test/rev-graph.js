var expect = require('chai').expect;


var config = require('../config.js')();

var res_driver = config.libs.db.resources();
var db = config.libs.db.db();

// Library under test:
var rg = require('../lib/rev-graph.js')(config);

var cur_resid = 567;

describe('rev-graph', function() {

  describe('#revs', function() {
    describe('.incrementRevString', function() {
      before(function() { 
        return rg.reset(); 
      });
      it('should increment 0-0 to 1-something', function() {
        expect(rg.incrementRevString('0-0')).to.match(/^1-.+$/);
      });
      it('should return 1-something if no string is passed', function() {
        expect(rg.incrementRevString()).to.match(/^1-.+$/);
      });
    });

    describe('.updateRevInVersionedLink', function() {
      var resourceid = '' + cur_resid++;
      var path = '/'+resourceid;
      var val = { 'thekey': 'the val' };
      var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST.1+json' } };
      before(function() {
        return rg.reset()
        .then(function() {
          return res_driver.put(path, val, opts);
        });
      });

      it('should update a versioned link\'s rev to current', function() {
        return rg.updateRevInVersionedLink({ _id: resourceid, _rev: '1-1' }, 'dummyresource', '/')
        .then(function(result) {
          expect(result).to.deep.equal({ _id: resourceid, _rev: '0-0' });
        });
      });
      it('should update a meta link\'s rev to current', function() {
        return rg.updateRevInVersionedLink({ _metaid: resourceid, _rev: '1-1' }, 'dummyresource', '/')
        .then(function(result) {
          expect(result).to.deep.equal({ _metaid: resourceid, _rev: '0-0' });
        });
      });
      it('should set the rev to 0-0 for circular links', function() {
        return rg.updateRevInVersionedLink({ _id: resourceid, _rev: '1-1' }, resourceid, '/')
        .then(function(result) {
          expect(result).to.deep.equal({ _id: resourceid, _rev: '0-0' });
        });
      });
      it('should leave a non-versioned-link alone', function() {
        return rg.updateRevInVersionedLink({ _id: resourceid }, 'dummyresource', '/')
        .then(function(result) {
          expect(result).to.deep.equal({ _id: resourceid });
        });
      });
    });

    describe('.updateVersionedLinksInObj', function() {
      var resourceid = '' + cur_resid++;
      var path = '/'+resourceid;
      var val = { 'thekey': 'the val' };
      var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST.1+json' } };
      before(function() {
        return rg.reset()
        .then(function() {
          res_driver.put(path, val, opts);
        });
      });
      it('should leave an object alone that has no versioned links', function() {
        var val = { a: 'vala', b: 'valb' };
        return rg.updateVersionedLinksInObj(val, 'dummyresourceid', '/')
        .then(function(result) {
          expect(result).to.deep.equal(val);
        });
      });
      it('should update a versioned link in a flat object', function() {
        var val = { versionedlink: { _id: resourceid, _rev: '1-1' } };
        return rg.updateVersionedLinksInObj(val, 'dummyresourceid', '/')
        .then(function(result) {
          val.versionedlink._rev = '0-0';
          expect(result).to.deep.equal(val);
        });
      });
      it('should update a versioned link in a nested object', function() {
        var val = { a: { b: { versionedlink: { _id: resourceid, _rev: '1-1' } } } };
        return rg.updateVersionedLinksInObj(val, 'dummyresourceid', '/')
        .then(function(result) {
          val.a.b.versionedlink._rev = '0-0';
          expect(result).to.deep.equal(val);
        });

      });
    });

  });

  describe('#child-parent', function() {
    // Note: the tests below implicitly test the childHas* functions
    // because it uses them to verify that a relationship has been added/removed.
    describe('.addChildParentRelationship', function() {
      before(function() {
        return rg.reset();
      });

      it('should add a childid and parentid with a path', function() {
        return rg.addChildParentRelationship('child', 'parent', 'thepath/1')
        .then(function() {
          return rg.childHasRelationships('child');
        }).then(function(result) {
          expect(result).to.equal(true);
          return rg.childHasParentRelationship('child', 'parent', 'thepath/1')
        }).then(function(result) {
          expect(result).to.equal(true);
        });
      });

    });

    describe('.removeChildParentRelationship', function() {
      before(function() {
        return rg.reset()
        .then(function() {
          return rg.addChildParentRelationship('child', 'parent', 'thepath/1');
        });
      });
      it('should remove an existing parent/child relationship', function() {
        return rg.removeChildParentRelationship('child', 'parent', 'thepath/1')
        .then(function() {
          return rg.childHasRelationships('child');
        }).then(function(result) {
          expect(result).to.equal(true); // child should still be there, just empty
          return rg.childHasParentRelationship('child', 'parent', 'thepath/1');
        }).then(function(result) {
          expect(result).to.equal(false); // that particular relationship should not be there.
        });
      });
    });

    describe('.removeChild', function() {
      before(function() {
        return rg.reset()
        .then(function() {
          return rg.addChildParentRelationship('child', 'parent', 'thepath/1');
        });
      });

      it('should remove all of a child\'s relationships', function() {
        return rg.removeChild('child')
        .then(function() {
          return rg.childHasRelationships('child');
        }).then(function(res) {
          expect(res).to.equal(false);
        });
      });
    });


  });


  describe('#queue-and-start-with-put', function() {
  
    var resourceid1 = '' + cur_resid++;
    var resourceid2 = '' + cur_resid++;
    var path1 = '/' + resourceid1;
    var path2 = '/' + resourceid2;
    var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST.1+json' } };
    var val1 = { a: 'vala', b: 'valb' };
    var val2 = { 
      c: 'valc', 
      versionedlink: { _id: resourceid1, _rev: '0-0' }, 
      nonversioned: { _id: resourceid1 },
    };
    before(function() {
      return rg.reset()
      .then(function() {
        return res_driver.put(path1, val1, opts);
      }).then(function() {
        return res_driver.put(path2, val2, opts);
      });
    });

    it('should have a child-parent relationship between resources after link creation', function() {
      return rg.childHasParentRelationship(resourceid1, resourceid2, path2+'/versionedlink')
      .then(function(result) {
        expect(result).to.equal(true);
      });
    });

    it('should not have updated the _rev\'s for either resource before we call start or handleQueue', function() {
      return res_driver.directGet(path1 + '/_rev')
      .then(function(info) {
        expect(info.val).to.equal('0-0');
        return res_driver.directGet(path2 + '/_rev');
      }).then(function(info) {
        expect(info.val).to.equal('0-0');
      });
    });

    describe('.handleQueue', function() {
      var resourceid1 = '' + cur_resid++;
      var resourceid2 = '' + cur_resid++;
      var path1 = '/' + resourceid1;
      var path2 = '/' + resourceid2;
      var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST.1+json' } };
      var val1 = { a: 'vala', b: 'valb' };
      var val2 = { 
        c: 'valc', 
        versionedlink: { _id: resourceid1, _rev: '0-0' }, 
        nonversioned: { _id: resourceid1 },
      };
      before(function() {
        return rg.reset()
        .then(function() {
          return res_driver.put(path1, val1, opts);
        }).then(function() {
          return res_driver.put(path2, val2, opts);
        });
      });
      // The two put's above should have created 4 resources (2 resources and 2 meta's),
      // queued them all up for _rev updates, and registered the links from the meta's
      // to the resources, and the versioned link in resource 2 (parent)
      // that points to resource 1 (child).  Fifo order should be:
      // 1. meta:resourceid1/_rev
      // 2. resourceid1/_rev  (from newEmptyResource)
      // 2-a. < repeat of resourceid1 (from setWrapper) >
      // 3. meta:resourceid2/_rev
      // 4. resourceid2/_rev  (from newEmptyResource)
      // 4-a. < repeat of resourceid2 (from setWrapper) >
      // 5. resourceid1/_rev --> queued after step 1 completes
      // 6. resourceid2/_rev --> queued after steps 2,3, and 5 complete, should only increment once

      it('1st call: should update the rev on meta:resource1 and resourceid1\'s link to it', function() {
        var updated_rev;
        return rg.handleQueue()
        .then(function() {
          return res_driver.get('/meta:'+resourceid1+'/_rev')
        }).then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
          return res_driver.get(path1);
        }).then(function(info) {
          expect(info.val._meta._rev).to.equal(updated_rev);
        });
      });

      it('2 + 2-a calls: should update the _rev on resource1 and resource2\'s link to it', function() {
        var updated_rev;
        return rg.handleQueue()
        .then(rg.handleQueue)
        .then(function() {
          return res_driver.get(path1+'/_rev')
        }).then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
        }).then(function() {
          return res_driver.get(path2); // get the entire resource2 to see versionedlink._rev
        }).then(function(info) {
          expect(info.val.versionedlink._rev).to.equal(updated_rev);
        });
      });

      it('3rd call: should update the _rev on meta:resource2 and resourceid2\'s link to it', function() {
        var updated_rev;
        return rg.handleQueue()
        .then(function() {
          return res_driver.get('/meta:'+resourceid2+'/_rev')
        }).then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
        }).then(function() {
          return res_driver.get(path2); // get the entire resource2 to see versionedlink._rev
        }).then(function(info) {
          expect(info.val._meta._rev).to.equal(updated_rev);
        });
      });

      it('4 + 4-a call: should update the _rev on resourceid2', function() {
        return rg.handleQueue()
        .then(rg.handleQueue)
        .then(function() {
          return res_driver.get(path2+'/_rev')
        }).then(function(info) {
          expect(info.val).to.match(/^1-.+$/); // incremented once
        });
      });

    });

    // Repeat all the above tests, but this time call start before and wait a reasonable
    // amount of time for them all to complete.
    describe('.start', function() {
      var resourceid1 = '' + cur_resid++;
      var resourceid2 = '' + cur_resid++;
      var path1 = '/' + resourceid1;
      var path2 = '/' + resourceid2;
      var opts = { _meta: { _mediaType: 'application/vnd.oada.TEST.1+json' } };
      var val1 = { a: 'vala', b: 'valb' };
      var val2 = { 
        c: 'valc', 
        versionedlink: { _id: resourceid1, _rev: '0-0' }, 
        nonversioned: { _id: resourceid1 },
      };
      before(function() {
        this.timeout(1500);
        return rg.reset()
        .then(function() {
          rg.start();
        }).then(function() {
          return res_driver.put(path1, val1, opts);
        }).then(function() {
          return res_driver.put(path2, val2, opts);
        }).delay(1000)
        .then(function() {
          rg.stop();
        });
      });

      it('should pass all the same tests as .handleQueue() after it is started/stopped', function() {
        var updated_rev;
        // metaid:resource1
        return res_driver.get('/meta:'+resourceid1+'/_rev')
        .then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
          return res_driver.get(path1);
        }).then(function(info) {
          expect(info.val._meta._rev).to.equal(updated_rev);
        
        // resource1
        }).then(function() {
          return res_driver.get(path1+'/_rev')
        }).then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
          return res_driver.get(path2); // get the entire resource2 to see versionedlink._rev
        }).then(function(info) {
          expect(info.val.versionedlink._rev).to.equal(updated_rev);

        // meta:resource2
          return res_driver.get('/meta:'+resourceid2+'/_rev')
        }).then(function(info) {
          updated_rev = info.val;
          expect(info.val).to.match(/^1-.+$/); // incremented once
        }).then(function() {
          return res_driver.get(path2); // get the entire resource2 to see versionedlink._rev
        }).then(function(info) {
          expect(info.val._meta._rev).to.equal(updated_rev);
        
        // resourceid2
          return res_driver.get(path2+'/_rev')
        }).then(function(info) {
          expect(info.val).to.match(/^1-.+$/); // incremented once
        });
      });

    });

  });

});
