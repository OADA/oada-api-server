var _ = require('lodash');

var islink = { _id: 123, _rev: '1-2342' };
var notlink = { _id: 123, _rev: '1-2342', dumbkey: 'shouldnt work' };

link_keys = [ '_id', '_rev' ];

console.log('isLink: ', _.isEqual(_.keys(islink), link_keys));
console.log('notlink: ', _.isEqual(_.keys(notlink), link_keys));
