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


/*
    This is the class for Stream
*/

var Stream = function(name, id){
    this.name = name;
    this.id = id;
}

/*
    This is the class for Vehicle
    TODO: This is probably going to be replaced by MongoDB model
 */
var Vehicle = function(vin, serial, model_year, model, name){
    //initializer
    this.id = vin;
    this.serial_number = serial;
    this.model_year = 2008;
    this.model = model;
    this.name = name;
}

Vehicle.prototype.get_available_streams = function(){
    /*
        return available streams for this Vehicle
    */
    return [new Stream("swath_width",1236), 
            new Stream("location",1237),
            new Stream("header_position",1238), 
            new Stream("wet_mass_flow",1239),
            new Stream("moisture",1240), 
            new Stream("geofence",1241)];
}

Vehicle.prototype.as_json = function(req){

    //Fill up dummy streams
    var available_streams = {};
    var G = this.get_available_streams();
    for(var idx in G){
        available_streams[G[idx].name] = {
            "_href": "http://" + req.headers.host + "/resources/" + G[idx].id
        }
    }

    //return a json with metadata
    return {
        "formats": {
            "vnd.oada.machines.harvester+json": {
                "original": true
            }
        },
        "meta": {
            "serial_number": this.serial_number,
            "model_year": this.model_year,
            "model" : this.model,
            "name": this.name
        },
        "data": {
            "streams": available_streams
        }
    }
}

router.get('/:name/:type/:id', function(req, res) {

    // TODO: Check the Authentication Bearer

    var cf_name = req.params.name; //name of the config file we are loading
    var cf_type = req.params.type; //type of config we are loading
    var cf_id = req.params.id;

    var meta_object = {};
    var formats_object = {};
    var data_resource_object = {};
    var list_of_resources = []

    if(cf_type == "machines"){
        var list_of_resources = [new Vehicle("4000AA", 14001130202, 2014, "8010", "Combine 1"),
                                 new Vehicle("4000BB", 14011510340, 2010, "4010", "Combine 2")];
    }

    var res_object = {
        "_href": "http://" + req.headers.host + "/" + cf_name + "/" + cf_type + "/" + cf_id,
        "_etag": "aabbccddeeffgg",
        "resource": {}
    }

    for(var index in list_of_resources){
        var resource_entry = list_of_resources[index];
        res_object.resource[resource_entry.id] = resource_entry.as_json(req);
    }

    res.json(res_object);
});

module.exports = router;
