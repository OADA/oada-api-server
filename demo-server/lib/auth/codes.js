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
  if(singleton) return singleton;

  var codeDriver = config.drivers.db.code();

  var _Codes = {
    findByCode: function(code, cb) {
      return codeDriver
        .get(code)
        .nodeify(cb);
    },

    save: function(code, cb) {
      return codeDriver
        .set(code.code, code)
        .then(function() {
          return codeDriver
            .get(code.code);
        })
        .nodeify(cb);
    },
  };

  singleton = _Codes;
  return singleton;
};
