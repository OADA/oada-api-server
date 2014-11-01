/*
     Copyright 2014 Open Ag Data Alliance
    
     Licensed under the Apache License, Version 2.0 (the "License");
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at
    
         http://www.apache.org/licenses/LICENSE-2.0
    
     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an "AS IS" BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License.
    
*/
module.exports = function () {
  this.World = require("../support/world.js").World;



  this.Then(/^the "([^"]*)" attribute of each item contains at least the following information:$/, function (what_attribute, table, callback) {
    var jspath = "$.*." + what_attribute;
    var iter = this.walker.eval(this.last_response, jspath);
    if(iter == null){
      callback.fail(new Error("Did not find attribute " + what_attribute));
    }
    for (var key in iter){
      var result = this.check_attr(table, iter[key]);
      if(!result.passed){
            callback.fail(result.E);
            return;
      }
    }
    callback();
  });





  this.Then(/^each key in "([^"]*)"|response has a valid resource with just the following information when requested ([^"]+) view parameter:$/, 
    function (subkey, view_state, table, callback) {
    var jsonpath = "$." + subkey;
    var target = [];

    if(subkey === undefined){
      //we specified to look in response just look through root
      target = this.last_response;
    }else{
      //if key is specified walk there
      target = this.walker.eval(this.last_response, "$.*")[0];
    }

    //obtain the keys for what we just walked to
    var fields = Object.keys(target);
    var has_view_parameter = (view_state == "with" ? 1 : 0);

    var view_param = encodeURIComponent(JSON.stringify({"$each":{"$expand":true}})); //TODO: replace with proper

    var root = this.root_url;
    var context = this;

    var checker = function(dut){
      var result = context.check_attr(table, dut);
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




  this.Then(/^the "([^"]*)" attribute of each "([^"]*)" contains at least the following information:$/,
      function (attribute_name, parent_key, table, callback) {

    var roots = this.walker.eval(this.last_response,
            this.current_model.vocabularies[parent_key].jsonpath);
    var cnt = 0;
    for(var rootkey in roots){
       if(this.roots[rootkey] === undefined) continue;
       var object = roots[rootkey];
       object = object[attribute_name];
       var result = this.check_attr(table, object);
       if(!result.passed){
        callback.fail(result.E);
        return;
       }
       cnt++;
    }

    callback();
  });


  this.Then(/^the "([^"]*)" attribute contains at least the following information:$/, function (attr, table, callback) {

       var jpath = "$." + attr;
       var object = this.walker.eval(this.last_response, jpath)[0];
       if(object === undefined){
          callback.fail(new Error("No attribute " + attr + " in the response"));
          return;
       }
       var result = this.check_attr(table, object);

       if(!result.passed){
          callback.fail(result.E);
          return;
       }
       callback();
  });




  this.Then(/^the "([^"]*)" attribute of each item in "([^"]*)" contains at least the following information:$/, 
    function (inner, outer, table, callback) {

    var jsonpath = "$." + outer + ".*." + inner;
    var iter = this.walker.eval(this.last_response, jsonpath);//this.last_response[outer];
 
    if(iter.length == 0) {
      callback.fail(new Error("The " + jsonpath + " attribute does not exist in response!"))
      return;
    }

    for(var i = 0; i < iter.length; i++){
       var result = this.check_attr(table, iter[i]);
       if(!result.passed){
        callback.fail(result.E);
        return;
       }
    }


    callback();
});


}