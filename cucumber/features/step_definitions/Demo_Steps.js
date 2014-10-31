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
  // console.log(object);
   
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
     if(has_view_parameter){
      this.current_url += "?view=" + encodeURIComponent(JSON.stringify(VIEW_PARAM));
     }
     console.log("Fetching " + this.current_url);

     var that = this;
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
         if(this.last_response[i] === undefined) continue;
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
       if(this.roots[rootkey] === undefined) continue;
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

  this.When(/^the client requests a "([^"]*)" stream for harvester with identifier "([^"]*)" ([^"]*) view parameter ([A-Za-z0-9_]+)$/,
      function (what_stream, vin, view_state, parameter_filename, callback) {

    var has_view_parameter = (view_state == "with" ? 1 : 0);
    var use_SSK = this.stream_keys[what_stream]; //stream specific key
    var _json_param = JSON.stringify(require("../support/view_parameters/" + parameter_filename +  ".json")).replace("<use_SSK>", use_SSK);
    var VIEW_PARAM = JSON.parse(_json_param); //TODO: redundant, to be removed
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
            var just_data_url = datalink;
            if(has_view_parameter)
              datalink += "?view=" + encodeURIComponent(JSON.stringify(VIEW_PARAM));

            console.log("Fetching final resource: " + datalink);

            that.current_url = just_data_url;  
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


  
  this.When(/^the items in "([^"]*)" has enter\-exit pair, if any exit\.$/, function (path_to_array, callback) {
      try{
        var matches = jsonPath.eval(this.last_response, path_to_array);
      }catch(ex){
        callback.fail(new Error("Unable to walk the JSON"));
        return; 
      }
      var fieldnames = [];
      var assoc = {};
      var walk = matches[0];

      var ENTER = "enter";
      var EXIT = "exit";

      //sort the walk
      this.utils.quicksort(walk ,0, walk.length, 't');

      //obtain list of fieldnames
      fieldnames = jsonPath.eval(walk, "$.*.field.name");
      for(var i in fieldnames){
        assoc[fieldnames[i]] = 0;
      }

      //check that $.event first item is enter
      if(jsonPath.eval(walk, "$.*.event").length == 0){
        callback.fail(new Error("Missing event attribute for each item in " + path_to_array));
        return; 
        //cannot continue
      }

      //check that first of any field is enter
      if(walk[0]["event"] != ENTER){
        console.log(walk["event"])
        return;
        callback.fail(new Error("$.event first item is NOT enter event"));
        //can continue
      }

      //check that every field has a matching pair in order (if any exit)
      for(var i in walk){
          var ev = walk[i];
          var fn = ev["field"]["name"];
          var xor_factor = 0;

          if(ev["event"] == EXIT){
            xor_factor = 0;
          }else if(ev["event"] == ENTER){
            xor_factor = 1;
          }

          assoc[fn] = (assoc[fn] ^ xor_factor); 
      }

      //final check
      for(var key in assoc){
          var valid = assoc[key];
          if(!valid){
            callback.fail(new Error("Field `" + key + "` or its preceeding Field does not have valid ENTER-EXIT matching pair"));
          }
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


  this.When(/^each key in "([^"]*)" has a valid resource with just the following information when requested ([^"]+) view parameter:$/, function (subkey, view_state, table, callback) {
    var fields = Object.keys(this.last_response[subkey]);
    var has_view_parameter = (view_state == "with" ? 1 : 0);
    var view_param = encodeURIComponent(JSON.stringify({"$each":{"$expand":true}}));

    var root = this.root_url;
    var context = this;

    var checker = function(dut){
      var result = check_attributes(table, dut);
      //check that the returned resource contains stuff we need
      if(!result.passed){
          callback.fail(result.E);
          return;
      }
      //check that there is just this and nothing else
      if(Object.keys(dut).length != table.rows().length){
          var EMES = "Too many attribute(s)! Looked for " + table.rows().length + " but got " + Object.keys(dut).length + ".. Skipping ahead.";
          callback.fail(new Error(EMES));
          return;
      }
    }


    var async_check_callback = function(){
       checker(context.last_response);  
       callback();   
    }


    var done_first_item_cb = function(){
      checker(context.last_response);

      //check the rest entries
      for(var i = 1; i < fields.length ; i++ ){
          var fid = fields[i];
          var field_url = root + "/resources/" +  fid + (has_view_parameter ? "?view=" + view_param : "");
          console.log("Fetching " + field_url);
          context.get(field_url, context.get_token(), async_check_callback);
          //TODO: maybe create a queue instead of getting everything at the same time (in World.js)
          //aka. limit to only few concurrent GET request at a time
      }
    }

    done_first_item_cb.fail = function(){ callback.fail(new Error("Unknown Error.")); }
    async_check_callback.fail = function(){ callback.fail(new Error("Unknown Error.")); }

    var fid = fields[0];
    var field_url = root + "/resources/" +  fid + (has_view_parameter ? "?view=" + view_param : "");
    console.log("Fetching " + field_url);

    context.get(field_url, context.get_token(), done_first_item_cb);

  });


  this.Then(/^each item in "([^"]*)" has at least the following information:$/, function (this_key, table, callback) {
    if(this.last_response == null){
      console.log("Error: last response is null. Test will stop")
      callback.fail(new Error("Fetal error! "));
      return;
    }

    var root = this.last_response[this_key];
    var nonskip = 0;
    for(var key in root){
	    var iterable = root[key];
      if(iterable == undefined) continue;
	    var result = check_attributes(table, iterable);
      if(!result.passed){
            callback.fail(result.E);
            return;
      }
      nonskip++;
    }

   if(nonskip == 0){
    callback.fail(new Error("The" + inner + " attribute is empty!")  );
    return;
   }
   callback();

 });

  this.Then(/^the "([^"]*)" of each item in "([^"]*)" contains at least the following information:$/, function (inner, outer, table, callback) {
    var iter = this.last_response[outer];
    if(iter === undefined) {
      callback.fail(new Error("The " + outer + " attribute does not exist in response!"))
      return;
    }
      
    var nonskip = 0;
    var keylist = Object.keys(iter); //{} is not iterable by key
    for(var i in keylist){
           var key = keylist[i];
           var iterable = iter[key][inner];
           if(iterable == undefined) continue;
           var result = check_attributes(table, iterable);
           if(!result.passed){
            callback.fail(result.E);
            return;
           }
           nonskip++;
    }

    if(nonskip == 0){
      callback.fail(new Error("The " + inner + " attribute is empty or does not exist!") );
      return;
    }
    callback();
});

this.When(/^remember the maximum value of "([^"]*)" for every items in "([^"]*)"$/, function (jsonpath, placekey, callback) {

  var dataset = this.last_response[placekey];
  A = jsonPath.eval(dataset, jsonpath)

  console.log("Number of records: " + A.length);


  this.utils.quicksort(A,0, A.length);
  var maxval = A[A.length - 1];
  this.remember(Number(maxval));

  console.log("Max _changeId: " + maxval);

  callback();

});

this.Then(/^check the "([^"]+)" stream again, this time with view parameter ([^"]+)$/, function (what_stream, view_param_doc, callback) {
  var use_SSK = this.stream_keys[what_stream]; 
  var recalled = this.recall();

  if(recalled == null){
    callback.fail(new Error("Fetal Error: Unable to recall saved variable."));
    return;
  }

  //TODO: make a generic view doc parser, it should be able to throw error if this.recall is null as well
  var view_GET = JSON.stringify(require("../support/view_parameters/" + view_param_doc +  ".json")).replace("<use_SSK>", use_SSK).replace("<last_remembered>", recalled); 

  //Form the new URL we need to fetch
  var full_url = this.current_url + "/?view=" + encodeURIComponent(view_GET);
  console.log("Fetching " + full_url);
  this.get(full_url, this.get_token(), callback);
});


this.When(/^all values of "([^"]*)" are equals to the previously remembered value$/, function (jsonpath, callback) {
  var A = jsonPath.eval(this.last_response, jsonpath);
  var N = this.recall();

  if(A === undefined || A.length == 0){
     callback.fail(new Error("The stream did not return any valid value."));
    return;
  }
  if(N == null){
    callback.fail(new Error("Fetal Error: Unable to recall saved variable."));
    return;
  }

  console.log("Verifying all _changeId = " + N);
  for(var index = 0; index < A.length; index++){
    var e_mesg = "Response contains record with incorrect changeId! (looking for " + this.recall() + " but found " + A[index] + ")";
    if(Number(A[index]) != Number(N)){
      callback.fail(new Error(e_mesg));
      return;
    }
  }
  callback();
});


}


module.exports = StepDef;
