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

//Allow superagent to use fake certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var configurations = require('./_auto_config');
var models = require('./known_words');
var request = require('superagent');
var utils = require('./utils');
var jsonPath = require('JSONPath');

var World = function World(callback) {
    this._lastResponse = null;
    var context = this;
    this.models = models;
    this.root_url = configurations.server.root;
    this.finder_path = configurations.server.bookmark;
    this.token = configurations.server.token_key;
    this.last_response  = null;
    this.utils = utils;
    this.walker = jsonPath;

    this.memory = null;


    this.remember = function(what){
        this.memory = what;
    }

    this.recall = function(){
        return this.memory;
    }
    
    this.get = function(uri, token, callback) {

        var r = request.get(uri).set('Authorization', 'Bearer ' + this.token).buffer(true);

        r.end(function(res) {
            if (res.error) { 
                //callback.fail(new Error(res.error));
                console.log("^^^^^ Failed. Unable to fetch URL. "  + uri);
                callback.fail(new Error(res.text));
                return;
            }
            context._lastResponse = res;
            context.last_response = JSON.parse(res.text); //temp fix for issue https://github.com/visionmedia/superagent/issues/270
            
            callback();
        });
    }

    this.get_token = function(){
        return this.token;
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

    /**
     *  check if all attributes specified in table exists in object
     *  @param {Object} table : attribute table passed  via cucumber
     *  @param {Object} object: object to be tested
    */
    this.check_attr = function(table, object){
       
       var pass = {passed: true, missing: [], E: null};

       for(var idx in table.rows()){
          var look_for = table.rows()[idx][0];
          //the thing we are looking for cannot be undefined (sometimes [Function] is part of rows())
          if(look_for == undefined) continue; 

            if(object[look_for] === undefined){
             pass.missing.push(look_for);
             pass.passed = false;
          }
       }
       pass.E = new Error("Missing Attribute: " + pass.missing.join(", "));
       return pass;
    }

    callback();
};

module.exports.World = World;
