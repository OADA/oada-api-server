/* Copyright 2014 Open Ag Data Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// A User object in the users database should look like this:
// {
//   username: 'theusername',
//   password: 'thepassword',
//   resource: { _id: '02jflkd0i2' }, // resource id for users document
// }
// A User object in the resources database should look like this:
// {
//   "username": "frank",
//   "name": "Farmer Frank",
//   "family_name": "Frank",
//   "given_name": "Farmer",
//   "middle_name": "",
//   "nickname": "Frankie",
//   "email": "frank@openag.io",
// }  
// The user returned from this class is the object from the resources
// database with the oada-specific keys of _id, _meta, _rev removed.


var singleton = null;

module.exports = function(config) {
  if (singleton) return singleton;

  var userDriver = config.libs.db.users();
  var resDriver = config.libs.db.resources();
  var log = config.libs.log();

  var authUserToFullUser = function(auth_user, opts) {
    opts = opts || {};
    if (!auth_user) return;
    return resDriver
    .get('/' + auth_user.resource._id)
    .then(function(info) {
      if (!info.found) return false;
      var full_user = info.val;
      if (!opts.keepoada) {
        delete full_user._id;
        delete full_user._meta;
        delete full_user._rev;
      }
      return full_user;
    });
  };


  // A users driver for oada-ref-auth should export two functions: 
  // findByUsername
  // findByUsernamePassword
  // In our case, we store the password in the auth users database,
  // and the rest of the info int he resources database.
  var _Users = {
 
    // If you want to keep the oada keys (_id, _meta, _rev) on the returned object,
    // pass opts = { keepoada: true }
    findByUsername: function(username, opts, cb) {
      if (typeof opts === 'function') cb = opts; // didn't pass options
      opts = opts || {};
      var auth_user = null;
      return userDriver
      .get(username)
      .then(function(user) {
        return authUserToFullUser(user, opts);
      }).nodeify(cb);
    },
  
    findByUsernamePassword: function(username, password, cb) {
      return userDriver
      .get(username)
      .then(function(user) {
        if (user && user.password === password) {
          log.debug('findByUsernamePassword: found user ', user.username);
          return authUserToFullUser(user)
        }
        return false;
      }).nodeify(cb);
    },

  };
  
  singleton = _Users;
  return singleton;
};
