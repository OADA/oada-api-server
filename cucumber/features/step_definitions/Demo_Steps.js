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

function check_attributes(table, object, passing_callback, callback){
      /**
       *  check if all attributes specified in table exists in object
       *  @param {Object} table : attribute table passed  via cucumber
       *  @param {Object} object: object to be tested
      */
      for(var idx in table.rows()){
            var look_for = table.rows()[idx][0];
            if(object[look_for] === undefined){
                return false;
            }else{
                passing_callback(look_for);
            }
      }

      return true;
}

function getNode(jsonpath, root, opt){
 //TODO: Replace this function with jsonpath thingy
    if(opt === undefined){
      opt = 0;
    }
    var node = root;
    var keys = jsonpath.split("/");
    try{
          for(var idx in keys){
            if (keys[idx] == "*"){
              node = node[Object.keys(node)[opt]];
              continue;
            }
            node = node[keys[idx]];
          }

    }catch(ex){
      return null;
    }
    return node;
  }
 
var StepDef = function () {
  /*
   *  Define all the definitions for the steps here
   *  
  */
  this.World = require("../support/world.js").World; 

  var context = this;
  this.Given(/^the client is logged in$/, function (callback) {
    //TODO: Obtain the token from wherever
    callback();
  });
  
  this.Given(/^the client is authorized$/, function (callback) {
    //TODO: Check token validity somehow
    callback();
  });

  this.When(/^the client requests "([^"]*)" for "([^"]*)" that are "([^"]*)"$/, function (arg0, arg1, arg2, callback) {
      //TODO: 'me' will go away
      this.current_url = this.root_url + "/" + arg0 + "/me/" + arg1 + "/" + arg2 + "?_expand=2";
      this.get(this.current_url, this.get_token(), callback);
      this.current_model = null;
      console.log("Endpoint: " + this.current_url);
  });


  this.Then(/^the response is a "([^"]*)"$/, function (model_name, callback) {
    // This step tells the parser what response model to use/expect in subsequent tests 
    this.current_model = this.models[model_name];
    try{
      this.last_response = JSON.parse(this._lastResponse.body);
    }catch(ex){
      console.log(this._lastResponse)
      callback.fail(new Error("Unable to parse response from test server. Invalid JSON from " + this.current_url));
    }
    console.log("Expecting a " + model_name + " back");
    callback();
  });


  this.Then(/^each "([^"]*)" has the following attributes:$/, function (item_key, table, callback) {
    var object = getNode(this.current_model.vocabularies[item_key].jsonpath, 
                         this.last_response);
    var result = check_attributes(table, object, function(child_key){
      console.log("[PASSED]  - Attribute Check for : " + item_key + "/" + child_key);
    });

    if(!result) callback.fail(new Error("Failed - Attribute Check for: " + item_key));
    
    callback();
  });


  this.Then(/^the "([^"]*)" attribute of each "([^"]*)" contains the following information:$/, function (attribute_name, parent_key, table, callback) {
    var iter = 0;
    do{
       var object = getNode(this.current_model.vocabularies[parent_key].jsonpath, 
                         this.last_response, 
                         iter++);

       if(object == null) break;

       object = object[attribute_name]; 

       var result = check_attributes(table, object, function(child_key){
         console.log("[PASSED]  - Attribute Check* for : " + parent_key + "/" + attribute_name + "/" + child_key);
       });

       if(!result) callback.fail(new Error("Failed - Attribute Check for: " + attribute_name));


    }while(object != null);
    callback();
  });

  this.Then(/^the "([^"]*)" attribute contains the following information:$/, function (attribute_name, table, callback) {
       var object = getNode(this.current_model.vocabularies[attribute_name].jsonpath, 
                         this.last_response, 
                         0);
       var result = check_attributes(table, object, function(key){
         console.log("[PASSED]  - Attribute Check for : " + attribute_name  + "/" + key);

       });
       if(!result) callback.fail(new Error("Failed - Attribute Check for: " + attribute_name));
       callback();
  });


  this.When(/^the client requests a "([^"]*)" stream for harvester with VIN "([^"]*)"$/, function (what_stream, vin, callback) {
    /*
      Obtain the requested stream link from configuration document
    */

    this.current_url = this.root_url + "/configurations/me/machines/harvesters?_expand=2";
    var that = this;

    var kallback = callback; //TODO: switch to superagent, and this may go away..

    this.get(this.current_url, this.get_token(), function(){
      var configobj = JSON.parse(that._lastResponse.body);
      var streamlink = configobj.items[vin].resource.data.streams[what_stream]._href;
      
      that.get(streamlink, that.get_token(), kallback);

    });
    this.current_model = null;
  });

  this.Then(/^the response contains the following information:$/, function (table, callback) {
    var object = JSON.parse(this._lastResponse.body);

    var result = check_attributes(table, object, function(key){
      console.log("[PASSED]  - Attribute Check for : resource/" + key + ".");
    });

    if(!result) callback.fail(new Error("Failed - Attribute Check for: " + arg1));

    callback();
  });

  this.Then(/^the "([^"]*)" attribute contains (\d+) or more item$/, function (attribute, min_children, callback) {
    //TODO: give suggestion that you maybe missing entry in the vocab definition
    var object = getNode(this.current_model.vocabularies[attribute].jsonpath, 
                         this.last_response, 
                         0);

    //TODO: items API format is {0:A, 1:B, 2:C}
    if(Number(object.length) < Number(min_children)){
      callback.fail(new Error("The property " + attribute + " must be iterable and have 0 more 1 items inside."));
    }
    console.log("[PASSED]  - " + attribute + " contains " + min_children +  " or more items.");
    callback();
  });

  this.Then(/^each item in "([^"]*)" has the following information:$/, function (this_key, table, callback) {
    var iterable = getNode(this.current_model.vocabularies[this_key].jsonpath, 
                         this.last_response, 
                         0);
    for(var key in iterable){
      var object = iterable[key];
      if(!check_attributes(table, object, function(key){
        console.log("[PASSED]  - Item Attribute Check for : resource/" + key + ".");
      })){ callback.fail(new Error("Failed - Item Attribute Check for: " + this_key)); }
    }
    callback();
  });

};

module.exports = StepDef;
