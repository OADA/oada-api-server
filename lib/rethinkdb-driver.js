'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var r = require('rethinkdb');

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


function RethinkDBDriver(config) {
    this.conn = r.connect(config);
}

function decompose(path) {
	return _.isArray(path) ? path : path.split('/').filter(_.identity); 
}

// Returns the ReQL query without running it
function getQ(dbname, path, opts) {
    var steps = decompose(path);

    var q = r.table(dbname).get(steps[0]).default(r.error('0'));
    for (var i = 1; i < steps.length; i++) {
        q = q.do(dbname, steps[i], i + '', gotoKey)
    }

    return q;
}

RethinkDBDriver.prototype.get = function get(dbname, path, opts) {
    return this.conn.then(function(conn) {
        return Promise.props({
            val: getQ(dbname, path, opts).run(conn),
            existent_path: path
        });
    }).catch(r.Error.ReqlUserError, function(err) {
        var i = JSON.parse(err.msg);
        return {
            existent_path: '/' + decompose(path).slice(0, i).join('/')
        };
    });
};

// Returns the ReQL query without running it
function setQ(dbname, path, val) {
    var steps = decompose(path);
    var s = steps.slice(0, -1);
    var e = steps[steps.length - 1];

    var q;
    if (s.length <= 0) {
        // Root document
        q = r.table(dbname)
            .insert(_.assign({}, val, {id: e}), {returnChanges: true});
    } else {
        // Subdocument
        var obj = {};
        obj[e] = val

        q = getQ(dbname, s, {})
            .default(setQ(dbname, s, {}).do(function(doc) {
                    return r.table(dbname).get(doc('id'));
                })
            )
            .update(obj, {returnChanges: true})
    }

    // Return the new version?
    return q('changes')(0)('new_val');
}

RethinkDBDriver.prototype.set = function set(dbname, path, val) {
    return this.conn.then(function(conn) {
        return setQ(dbname, path, val).run(conn);
    });
};

RethinkDBDriver.prototype.remove = function remove(dbname, path) {
};

module.exports = function(config) {
    return new RethinkDBDriver(config);
};
