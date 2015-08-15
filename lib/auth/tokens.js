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

var _ = require('lodash');

var singleton = null;

module.exports = function(config) {
  if(singleton) return singleton;

  var authDriver = config.drivers.db.auth();

  var _Tokens = {
    findByToken: function(token, cb) {
      return authDriver
        .get(token)
        .nodeify(cb);
    },
  
    save: function(token, cb) {
      var t = _.cloneDeep(token);
      t.user = {_id: token.user._id};
      return authDriver
        .set(t.token, t)
        .then(function() {
          return authDriver
            .get(t.token);
        })
        .nodeify(cb);
    },
  
  };

  singleton = _Tokens;
  return singleton;
};
