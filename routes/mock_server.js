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

router.get('/resources/*', function(req, res) {

    var rest_path = req.params[0].split("/");
    var id = rest_path.shift();

    var mParser = new docparser(req.headers.host);
    var res_object = {};
    // Pull up document format template
    try{
        var normal = require('../documents/' + id + '.json');
        res_object = normal;

        if("view" in req.query){
            var view_param_hash = md5(req.query.view);
            console.log("vp hash: " + view_param_hash);
            // var search = jsonPath.eval(view_param, '$.*.*._meta._changeId');
            res_object = require('../documents/' + id + '_' + view_param_hash + '.json');
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
        //TODO: Actually putting data into the placeholder
    }catch(exp){
        //Send out error message for unsupported Resource ID
        console.log(exp);
        res.status(404).send('No document ' + '../documents/' + id + '_' + view_param_hash + '.json');
    }
    
    res_object = mParser.parseTokens(res_object);
    res.json(res_object);
});


//TODO: Need a way to elegantly generate config responses

router.get('/bookmarks/machines/harvesters(/?)', function(req, res) {

    // TODO: Check the Authentication Bearer
    var rest_path = req.params[0].split("/");

    var mParser = new docparser(req.headers.host);
    var res_object = {};

    try{
        res_object = require('../documents/bookmark.json');

        if(rest_path.length > 1 || req.query['_expand'] == '2'){
            //if expansion is on, we expand
            var resource = require('../documents/1300.json');
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
        res.status(404).json({
            "error": "unsupported resource",
            "reason": exp.message
        });
    }
    
    res_object = mParser.parseTokens(res_object);
    res.json(res_object);
});

router.get('/bookmarks/fields(/?)', function(req, res) {

    // TODO: Check the Authentication Bearer
    var rest_path = req.params[0].split("/");

    var mParser = new docparser(req.headers.host);
    var res_object = {};

    try{
        var normal = require('../documents/fields.json');
        res_object = normal;

        if("view" in req.query){
            var view_param_hash = md5(req.query.view);
            console.log("vp hash: " + view_param_hash);
            res_object = require('../documents/fields' + '_' + view_param_hash + '.json');
        }


        // if(rest_path.length > 1 || req.query['_expand'] == '2'){
        //     //if expansion is on, we expand
        //     var resource = require('../documents/1300.json');
        // }

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
        res.status(404).json({
            "error": "unsupported resource",
            "reason": exp.message
        });
    }
    
    res_object = mParser.parseTokens(res_object);
    res.json(res_object);
});


module.exports = router;
