#!/usr/bin/node
fs = require('fs');
if(process.argv.length < 4){
  console.log("Usage: make_responses.js <data_file.csv> <template_name.json>");
  return;
}
var file = process.argv[2];
var template = process.argv[3];
var header = {}; //this is what a 'record' look like (will be generated)
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
 console.log(header );
 fs.readFile(file,'utf-8', cb_data);
}

function cb_data(error, data){
  data = data.replace(/'/g, "");
  if(error) return console.log(error);
  _data = data.split("\r\n");
  for(row_i in _data){
    console.log(_data[row_i]);
    row = _data[row_i].split(";");
    var object = {};
    for(fc in row){
      object[header[fc]] = row[fc];
    }
    console.log(object);
  }

}
