#!/usr/bin/node
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

This scripts generate the response document from csv can data
*/

fs = require('fs');
if(process.argv.length < 5){
  console.log("Usage: make_responses.js <data_file.csv> <template_name.json> <data_property>");
  return;
}

var file = process.argv[2];
var template = process.argv[3];
var header = {}; //this is what a 'record' look like (will be generated)
var record = require("./" + template.replace(".json","_record.json"));
var fulldoc = require("./" + template);
var Table = [];

fs.readFile('data/header.csv', 'utf-8', cb_header);

function cb_header(error, data){
 if(error) return console.log(error);
 //generate Record object
 _data = data.split(";");
 for(var i in _data){
   var field = _data[i].match(/[a-zA-Z0-9_-]+/g)[0];
   header[i] = field;
 }
 fs.readFile(file,'utf-8', cb_data);
}

function cb_data(error, data){
  if(error) return console.log(error);
  var A = [];
  var logs = [];
  data = data.replace(/'/g, "");
  _data = data.split("\r\n");
  for(row_i in _data){
    row = _data[row_i].split(";");
    var object = {};

    for(fc in row){
      if(row[fc] == "") continue;
      object[header[fc]] = row[fc];
    }
    //console.log(object);
    logs.push(object);
    object.num_value = Number(object.num_value) * parseFloat(object.resolution);
    V = JSON.parse(JSON.stringify(record));
    for(var key in V){
      V[key] = object[V[key]];
    }
    A.push(V);
  }
  fs.writeFile("log.txt", JSON.stringify(logs), null);
  fulldoc[process.argv[4]] = A;
  console.log(JSON.stringify(fulldoc));
}
