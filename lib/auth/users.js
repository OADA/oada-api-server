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

var singleton = null;

module.exports = function(config) {

  var userDriver = config.libs.db.users();
  var resDriver = config.libs.db.resources();

  var lookupUserRes = function (user) {
    return resDriver
      .get('/' + user.resource._id)
      .then(function(user) {
        return user.val;
      });
  };


  var _Users = {
  
    findByUsername: function(username, cb) {
      return userDriver
        .get(username)
        .then(function(user) {
          return lookupUserRes(user);
        })
        .nodeify(cb);
    },
  
    findByUsernamePassword: function(username, password, cb) {
      return userDriver
        .get(username)
        .then(function(user) {
          if (user.password === password) {
            return lookupUserRes(user);
          } else {
            return false;
          }
        })
        .nodeify(cb);
    },
  };
  
  singleton = _Users;
  return singleton;
};
