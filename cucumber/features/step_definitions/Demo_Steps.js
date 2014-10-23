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

var jsonPath = require('JSONPath');

/**
 *  check if all attributes specified in table exists in object
 *  @param {Object} table : attribute table passed  via cucumber
 *  @param {Object} object: object to be tested
*/
function check_attributes(table, object){
   var pass = {passed: true, missing: [], E: null};
   for(var idx in table.rows()){
      var look_for = table.rows()[idx][0];

	    if(object[look_for] === undefined){
         pass.missing.push(look_for);
         pass.passed = false;
      }
   }
   pass.E = new Error("Missing Attribute: " + pass.missing.join(", "));
   return pass;
}

function getNode(jsonpath, root, opt){
    var node = jsonPath.eval(root, jsonpath);
    if(node[0] === undefined){
        //so that the test will stop
    	  throw {"reason": "json path is invalid" };
    }
    return node[0];
  }

/*
 *  Define all the definitions for the steps here
 *
*/
var StepDef = function () {
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


  this.When(/^the client requests the "([^"]*)" bookmark ([A-Za-z]*) view parameter$/, function (bk_name, view_state, callback) {
     var has_view_parameter = (view_state == "with" ? 1 : 0);
     var VIEW_PARAM = {"$each":{"$expand":true}};

     this.current_url = this.root_url + "/bookmarks/" +  bk_name;
     if(has_view_parameter)
      this.current_url += "?view=" + encodeURIComponent(JSON.stringify(VIEW_PARAM));
     var that = this;
     console.log("Fetching " + this.current_url);
     this.get(this.current_url, this.get_token(), callback);
  });

  this.Then(/^the response is a "([^"]*)"$/, function (model_name, callback) {
    //TODO: To be removed - this specification is redundant
    // This step tells the parser what response model to use/expect in subsequent tests
    this.current_model = this.models[model_name];
    console.log("Expecting a " + model_name + " back");
    callback();
  });

  this.Then(/^each "([^"]*)" has the following attributes:$/, function (item_key, table, callback) {

    var object = getNode(this.current_model.vocabularies[item_key].jsonpath,
                         this.last_response);
    var result = check_attributes(table, object);

    if(!result.passed) {
      callback.fail(result.E);
      return;
    }

    callback();
  });


  this.Then(/^the response contains (\d+) or more items$/, function (minkey, callback) {
      var cnt = 0;
      this.last_response = this.last_response;
      for (var i in this.last_response){
         cnt++;
      }
      if(cnt < minkey) 
      {
        callback.fail(new Error(">> Error: Didn't contain enough key - " + cnt +  " keys found"));
        return;
      }
      callback();
  });


  this.Then(/^the "([^"]*)" attribute of each "([^"]*)" contains at least the following information:$/,
      function (attribute_name, parent_key, table, callback) {
    var roots = jsonPath.eval(this.last_response,
            this.current_model.vocabularies[parent_key].jsonpath);
    var cnt = 0;
    for(var rootkey in roots){
       var object = roots[rootkey];
       object = object[attribute_name];
       var result = check_attributes(table, object);
       if(!result.passed){
        callback.fail(result.E);
        return;
       }
       cnt++;
    }

    callback();
  });

  this.Then(/^the "([^"]*)" attribute contains at least the following information:$/, function (attribute_name, table, callback) {
       var object = getNode(this.current_model.vocabularies[attribute_name].jsonpath,
                         this.last_response,
                         0);
       var result = check_attributes(table, object);
       if(!result.passed){
          callback.fail(result.E);
          return;
       }
       callback();
  });

   this.When(/^the client requests for the harvester with identifier "([^"]*)"$/, function (vin, callback) {

     this.current_url = this.root_url + "/" +  this.finder_path;
     var that = this;
     var kallback = callback;
     console.log("Fetching " + this.current_url);
     this.get(this.current_url, this.get_token(), function(){
         var configobj = that.last_response;
         var streamlink = that.root_url + "/resources/" + configobj[vin]._id;

         that.get(streamlink, that.get_token(), kallback);
     });
  });

  this.When(/^the client requests a "([^"]*)" stream for harvester with identifier "([^"]*)" ([^"]*) view parameter ([A-Za-z0-9_])?$/,
      function (what_stream, vin, view_state, parameter_filename, callback) {

    var has_view_parameter = (view_state == "with" ? 1 : 0);
    var use_SSK = this.stream_keys[what_stream]; //stream specific key
    var _json_param = JSON.stringify(require("../support/view_parameters/" + parameter_filename +  ".json")).replace("<use_SSK>", use_SSK);
    var VIEW_PARAM = JSON.parse(_json_param);
    //navigate to finder
    this.current_url = this.root_url + "/" + this.finder_path;


    var that = this;

    var kallback = callback;
    this.get(this.current_url, this.get_token(), function(){
      var configobj = that.last_response;
      //fetch the link to the resource we want
      var streamlink = that.root_url + "/resources/" + configobj[vin]._id;

      //load that configuration documents
      console.log("Fetching " + streamlink );
      that.get(streamlink, that.get_token(), function(){
            var resourceobj = that.last_response;
            var datalink = that.root_url + "/resources/" + resourceobj.streams[what_stream]._id;
            //load that stream
            if(has_view_parameter)
              datalink += "?view=" + encodeURIComponent(JSON.stringify(VIEW_PARAM));

            console.log("Fetching: " + datalink);

	          that.get(datalink, that.get_token(), kallback);
      });
    });
    this.current_model = null;
  });

  this.Then(/^the response contains at least the following information:$/, function (table, callback) {
    var object = this.last_response;
    var result = check_attributes(table, object);
    if(!result.passed){
      callback.fail(result.E);
      return;
    }

    callback();
  });


  this.Then(/^the "([^"]*)" attribute contains (\d+) or more item$/, function (attribute, min_children, callback) {
    // var object = jsonPath.eval(this.last_response,this.current_model.vocabularies[attribute].jsonpath );
    var object = this.last_response[attribute];

    if(Number(object.length) < Number(min_children)){
      callback.fail(new Error("The property " + attribute + " must be iterable and have " + min_children + " or more children."));
      return;
    }
    callback();
  });

  this.Then(/^the "([^"]*)" attribute contains only (\d+) item$/, function (attribute, exact_children, callback) {

    // var object = jsonPath.eval(this.last_response,this.current_model.vocabularies[attribute].jsonpath);
    var object = this.last_response[attribute];

    if(Number(object.length) != Number(exact_children)){
      callback.fail(new Error("The property " + attribute + " must be iterable and have exactly "  + exact_children + " children."));
      return;
    }
    callback();
  });

  this.Then(/^each item has at least the following information:$/, function (table,callback) {
     if(this.last_response === undefined){
       callback.fail(new Error("No response from previous step"));
     }
     for(var key in this.last_response){
         var result = check_attributes(table, this.last_response[key]);
         if(!result.passed){
            callback.fail(result.E);
            return;
         }
     }
     callback();
  });

  this.Then(/^each item has just the following information:$/, function (table,callback) {
     if(this.last_response === undefined){
       callback.fail(new Error("No response from previous step"));
       return;
     }

     for(var key in this.last_response){
         var dut = this.last_response[key];
         var result = check_attributes(table, dut);
         if(!result.passed){
            callback.fail(result.E);
            return;
         }
         if(Object.keys(dut).length != table.rows().length){
          callback.fail(new Error("Too many attribute(s)! Looked for " + table.rows().length + " but got " + Object.keys(dut).length));
          return;
         }
     }


     callback();
  });


  this.When(/^each key in "([^"]*)" has a valid resource with just the following information:$/, function (subkey,table, callback) {
    var fields = Object.keys(this.last_response[subkey]);

    var root = this.root_url;
    var context = this;

    var testcount = 0;
    var failcount = 0;

    var CustomCallback = function(){
      var dut = context.last_response;
      var result = check_attributes(table, dut);
      if(!result.passed){
          callback.fail(result.E);
          return;
      }
      //check that there is just this and nothign else
      if(Object.keys(dut).length != table.rows().length){
          callback.fail(new Error("Too many attribute(s)! Looked for " + table.rows().length + " but got " + Object.keys(dut).length));
          return;
      }

      if(++testcount == fields.length){
        //do callback if we are done checking all the fields
        callback();
      }
    }

    CustomCallback.pending = function(){
       callback.pending();
    }

    CustomCallback.fail = function(e){
       failcount++;
       callback.fail(new Error(e));
    }

    var FirstCallback = function(){

      var dut = context.last_response;
      var result = check_attributes(table, dut);
      if(!result.passed){
          callback.fail(result.E);
          return;
      }
      //check that there is just this and nothign else
      if(Object.keys(dut).length != table.rows().length){
          callback.fail(new Error("Too many attribute(s)! Looked for " + table.rows().length +
           " but got " + Object.keys(dut).length) + ".. Skipping ahead.");
          return;
      }

      if(++testcount == fields.length){
        //check the rest
        for(var i = 1; i < fields.length ; i++ ){
          var fid = fields[i];
          var field_url = root + "/resources/" +  fid;
          console.log("Fetching " + field_url);
          context.get(field_url, context.get_token(), CustomCallback);
          //TODO: create a get auto-queue instead of getting everything at the same time
        }
      }

      
    }

    FirstCallback.fail = CustomCallback.fail;
    FirstCallback.pending = CustomCallback.pending;


    //check the first one separately so we can skip the rest if the first is wrong
    var fid = fields[0];
    var field_url = root + "/resources/" +  fid;
    console.log("Fetching " + field_url);
    context.get(field_url, context.get_token(), FirstCallback);

  });


  this.Then(/^each item in "([^"]*)" has at least the following information:$/, function (this_key, table, callback) {
    if(this.last_response == null){
      console.log("Error: last response is null. Test will stop")
      callback.fail(new Error("Fetal error! "));
      return;
    }
    var root = this.last_response[this_key];

    for(key in root){
	    var iterable = root[key];
	    var result = check_attributes(table, iterable);
      if(!result.passed){
            callback.fail(result.E);
            return;
      }
    }

   callback();

 });

  this.Then(/^the "([^"]*)" of each item in "([^"]*)" contains at least the following information:$/, function (inner, outer, table, callback) {
    var iter = this.last_response[outer];
    for(key in iter){
           var iterable = iter[key][inner];
           //console.log(iterable);
           var result = check_attributes(table, iterable);
           if(!result.passed){
            callback.fail(result.E);
            return;
           }
    }
    callback();
});


}


module.exports = StepDef;
