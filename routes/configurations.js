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
var md5 = require('MD5');
var docparser = require('../parser');

var express = require('express');
var router = express.Router();

//TODO: Need a way to elegantly generate config responses

router.get('/*', function(req, res) {

    // TODO: Check the Authentication Bearer
    var rest_path = req.params[0].split("/");
    var cf_name = rest_path.shift(); //name of the config file we are loading
    var cf_type = rest_path.shift(); //type of config we are loading
    var cf_id = rest_path.shift();

    var mParser = new docparser(req.headers.host);
    var res_object = {};

    try{
        res_object = require('../documents/configurations/' + cf_type + '/' + cf_id + '.json');

        if(rest_path.length > 1 || req.query['_expand'] == '2'){
            var resource = require('../documents/configurations/' + cf_type + '/resource/' + cf_id + '.json');
            res_object['resource'] = resource;
        }else{
            //Hardcoded 
            res_object['resource'] = {
                "4000AA": "<URI>/configurations/me/machines/harvesters/resource/4000AA"
            }
        }

        //walk through the requested REST Path
        for(var idx in rest_path){
            var child = rest_path[idx];
            if(child == ""){
                continue;
            }
            if(!res_object.hasOwnProperty(child)){
                throw {"message": "The resource you requested does not exist."};
            }
            res_object = res_object[child];
        }
    }catch(exp){
        res.json({
            "error": "unsupported resource",
            "reason": exp.message
        });
    }
    
    res_object = mParser.parseTokens(res_object);
    res.json(res_object);
});

module.exports = router;
