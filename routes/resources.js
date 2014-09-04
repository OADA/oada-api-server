"use strict";
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

var express = require('express');
var router = express.Router();

/* GET resource listing. */
router.get('/*', function(req, res) {

    //TODO: Check the Authentication Bearer
    var rest_path = req.params[0].split("/");
    var id = rest_path[0];
    

    //TODO: Is _etag dependent on id?
    var res_object = {
        "_href": "https://" + req.headers.host + "/resources/" + id,
        "_etag": "aabbccdd", 
        "_changeId": "abcdef"
    }
    
    if(id == 1236){
        //Swath Width
        var formats_object = {};
        var meta_object = {};
        var data_resource_object = {
            "_href": "https://" + req.headers.host + "/resources/" + id + "/data"
        };
    
        //Get metadata for the “swath_width” stream
        formats_object["vnd.oada.harvester.streams.swath_width"] = {
            "original": true
        }
        meta_object["units"] = "feet";
        res_object["meta"] = meta_object;
        res_object["formats"] = formats_object;
        res_object["data"] = data_resource_object;
    }else if(id == 1241){
        //Geofence streams
        var t0 = new Date();
        res_object["formats"] = "application/vnd.oada.machines.harvester.streams.geofence.1+json";
        res_object["items"] = [{
            "time" : t0,
            "action": "enter",
            "field" : "https://" + req.headers.host + "/resources/" + "1239i3j"
        }]
    }else{
        //Pull up document format template
        try{
            res_object = require('../documents/' + id + '.json');
        }catch(exp){
            //Send out error message for unsupported Resource ID
            console.log(exp);
            res.json({
                "error": "unsupported resource"
            });
        }
    }

    

    res.json(res_object);
});

module.exports = router;
