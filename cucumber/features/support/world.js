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
var configurations = {
    "hostname": "http://oada-test.herokuapp.com"
}

var request = require('request')
var World = function World(callback) {
    this._lastResponse = null;
    var context = this;

    this.root_url = configurations.hostname;
    
    this.get = function(uri, token, callback) {
        var header_object = {'User-Agent': 'request'}
        if(token !== null){
            header_object['Authentication'] = 'Bearer ' + token;
        }
        request.get({
                    url: uri, 
                    headers: header_object
                        },function(error, response) {
                            if (error) {
                                return callback.fail(new Error(error.message))
                            }
                            context._lastResponse = response;
                            callback();
        });
    }

    this.get_token = function(){
        return "123456";
    }

    this.post = function(uri, token, callback){
        var header_object = {'User-Agent': 'request'}
        if(token !== null){
            header_object['Authentication'] = 'Bearer ' + token;
        }
        request({
            url: uri,
            body: requestBody,
            method: "POST",
            headers: header_object
        }, function(error, response){
                    if (error) {
                return callback(new Error(error.message));
                    }
                    console.log(response);
                    callback();
        });
    }
    
    /*
        Very important portion of the test,
        these are sets of english words that our parser knows about.
        
        an asterisk (*) denotes "any string".
    */
    this.models = {
        "configuration" : {
            "vocabularies": {
                "machine": {
                    "jsonpath": "items/*/resource"
                },
                "resource": {
                    "jsonpath": "items/*/resource"
                },
                "streams":{
                    "jsonpath": "items/*/resource/data/streams"
                },
                "formats":{
                    "jsonpath": "items/*/resource/formats"
                }
            }
        },
        "resource": {
            "vocabularies": {
                "items": {
                    "jsonpath": "data/items"
                },
                "data": {
                    "jsonpath": "data"
                },
                "meta": {
                    "jsonpath" : "meta"
                },
                "formats": {
                    "jsonpath" : "formats"
                }
            }
        }
    }


    callback();
};

module.exports.World = World;
