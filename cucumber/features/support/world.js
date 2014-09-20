/*
# Copyright 2014 Open Ag Data Alliance
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
*/

//Initialize your parameters here
var configurations = require('./config');
var models = require('./known_words');
var request = require('superagent')

var World = function World(callback) {
    this._lastResponse = null;
    var context = this;
    this.models = models; 
    this.root_url = configurations.server.root;
    
    this.get = function(uri, token, callback) {
        var r = request.get(uri);

        if(token !== null){
            r.set('Authentication', 'Bearer ' + token);
        }

        r.end(function(res) {
            if (res.error) { return callback.fail(new Error(res.error)); }

            context._lastResponse = res;
            callback();
        });
    }

    this.get_token = function(){
        return "123456";
    }

    this.post = function(uri, token, callback){
        var r = request.post(uri);

        if(token !== null){
            r.set('Authentication', 'Bearer ' + token);
        }

        r.end(function(res){
            if (res.error) { return callback.fail(new Error(res.error)); }

            callback();
        });
    }
    
    callback();
};

module.exports.World = World;
