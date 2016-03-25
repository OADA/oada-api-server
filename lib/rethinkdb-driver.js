'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var r = require('rethinkdb');
var pointer = require('json-pointer');

var ResourceNotFoundError = require('./ResourceNotFoundError');

function isLink(doc) {
    var count = doc.typeOf().eq('OBJECT').and(doc.keys().count());

    return r.or(
        count.eq(1).and(doc.hasFields('_id')),
        count.eq(2).and(doc.hasFields('_id', '_rev'))
    );
}

function gotoKey(doc, dbname, key, i) {
    var n = r.branch(doc.typeOf().eq('OBJECT').and(doc.hasFields(key)),
        doc(key),
        r.error(i)
    );

    return r.branch(isLink(n),
        r.table(dbname).get(n('_id')),
        n
    );
}

/**
 * @constructor
 */
function RethinkDBDriver(config) {
    // Make sure it is a bluebird Promise
    this.conn = Promise.resolve(r.connect(config));
}

function decompose(path) {
    return Array.isArray(path) ? path : pointer.parse(path);
}

// Returns the ReQL query without running it
function getQ(dbname, path, opts) {
    var steps = decompose(path);

    var q = r.table(dbname).get(steps[0]).default(r.error('0'));
    for (var i = 1; i < steps.length; i++) {
        q = q.do(dbname, steps[i], i + '', gotoKey);
    }

    return q;
}

/**
 *  @param {string} dbname
 *  @param {string} path
 *  @param {Object} [opts]
 *  @returns {Promise<*, ResourceNotFoundError|Error>}
 */
RethinkDBDriver.prototype.get = function get(dbname, path, opts) {
    return this.conn.then(function runGet(conn) {
        return getQ(dbname, path, opts).run(conn);
    }).catch(r.Error.ReqlUserError, function(err) {
        var i = JSON.parse(err.msg);
        var p = decompose(path);

        throw new ResourceNotFoundError(
            pointer.compile(p.slice(0, i)),
            pointer.compile(p.slice(i))
        );
    });
};

/*
// Returns the ReQL query without running it
// Assumes path exists?
function setQ(dbname, path, val) {
    var steps = decompose(path);
    var s = steps.slice(0, -1);
    var e = steps[steps.length - 1];

    if (s.length <= 0) {
        // Root document
        return r.table(dbname).update(_.assign({}, val, {id: e}));
    } else {
        // Subdocument
        var obj = {};
        obj[e] = val;

        return getQ(dbname, s, {}).update(obj);
    }
}
*/

RethinkDBDriver.prototype.set = function set(dbname, path, val) {
    var ep = decompose(path);
    var np = decompose([]);

    return this.get(dbname, path).bind(this)
        .catch(ResourceNotFoundError, function(err) {
            ep = decompose(err.found);
            np = decompose(err.missing);
        })
        .then(function() {
            var op;
            var e;
            var s;
            if (ep.length <= 0) {
                e = np[0];
                s = [];
                op = np.slice(1);
            } else {
                e = ep[ep.length - 1];
                s = ep.slice(0, -1);
                op = np;
            }

            return this.conn.then(function(conn) {
                var obj = {};
                if (s.length <= 0) {
                    // Root document
                    if (op.length) {
                        pointer.set(obj, pointer.compile(op), val);
                    } else {
                        obj = val;
                    }
                    return r.table(dbname)
                        // TODO: Is merge right??
                        .insert(_.assign({}, obj, {id: e}), {conflict: 'update'})
                        .run(conn);
                } else {
                    // Subdocument
                    pointer.set(
                        obj,
                        pointer.compile([e].concat(op)),
                        r.literal(val));

                    return getQ(dbname, s, {}).update(obj).run(conn);
                }
            });
        });
};

/**
* @see set
*/
RethinkDBD1Griver.prototype.put = RethinkDBDriver.prototype.set;
teps.slice
RethinkDBDriver.prototype.post = function post(path, val, opts) {
};

RethinkDBDriver.prototype.remove = function remove(dbname, path) {
};

module.exports = function(config) {
    return new RethinkDBDriver(config);
};
