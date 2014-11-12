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

    this.When(/^remember "([^"]*)"$/, function (jsonpath, callback) {
	  var V = this.walker.eval(this.last_response, jsonpath)[0]
	  if(V === undefined){
	  	callback.fail(new Error("Unable to map " + jsonpath));
	  }
	  this.remember(Number(V));
	  callback();
	});

    this.Then(/^remember all "([^"]*)"$/, function (jsonpath, callback) {
      var target = this.walker.eval(this.last_response, jsonpath);
      if(target === undefined || target == null){
      	  callback.fail(new Error("Unable to map " + jsonpath));
      }
	  this.remember(target);
	  callback();
	});



	this.Then(/^remember the maximum value of "([^"]*)" for every items in "([^"]*)"$/, function (jsonpath, placekey, callback) {

	  var dataset = this.last_response[placekey];
	  if(dataset === undefined){
	  	callback.fail(new Error("There is no key called " + placekey + " in the response!"));
	  	return;
	  }
	  A = this.walker.eval(dataset, jsonpath)

	  console.log("Number of records: " + A.length);

	  this.utils.quicksort(A,0, A.length);
	  var maxval = A[A.length - 1];
	  this.remember(Number(maxval));

	  console.log("Max _changeId: " + maxval);

	  callback();

	});

  
	  this.When(/^the items in "([^"]*)" has enter\-exit pair, if any exit\.$/, function (path_to_array, callback) {
	      try{
	        var matches = this.walker.eval(this.last_response, path_to_array);
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
	      fieldnames = this.walker.eval(walk, "$.*.field.name");
	      for(var i in fieldnames){
	        assoc[fieldnames[i]] = 0;
	      }

	      //check that $.event first item is enter
	      if(this.walker.eval(walk, "$.*.event").length == 0){
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


	this.Then(/^check the "([^"]+)" stream again, this time with view parameter ([^"]+)$/, function (what_stream, view_param_doc, callback) {
	  var recalled = this.recall() - 1;

	  if(recalled == null){
	    callback.fail(new Error("Fetal Error: Unable to recall saved variable."));
	    return;
	  }
	  console.log(recalled)

	  var view_GET = JSON.stringify(require("../support/view_parameters/" + view_param_doc +  ".json")).replace("<last_remembered>", recalled); 
	  console.log("Using View: " + view_GET);

	  //Form the new URL we need to fetch
	  var full_url = this.current_url + "/?view=" + encodeURIComponent(view_GET);
	  console.log("Fetching " + full_url);
	  this.get(full_url, this.get_token(), callback);
	});


	this.Then(/^all values of "([^"]*)" are equals or greater than to the previously remembered value$/, function (jsonpath, callback) {
	  var A = this.walker.eval(this.last_response, jsonpath);
	  var N = this.recall() - 1;


	  if(A === undefined || A.length == 0){
	     callback.fail(new Error("The stream structure is invalid, cannot walk to " + jsonpath));
	    return;
	  }
	  if(N == null){
	    callback.fail(new Error("Fetal Error: Unable to recall saved variable."));
	    return;
	  }

	  console.log("Verifying all _changeId = " + N);

	  this.utils.quicksort(A ,0, A.length);


	  for(var i = 0; i < A.length; i++){
	    var e_mesg = "Response contains record with incorrect changeId! (looking for " + this.recall() + " but found " + A[i] + ")";
	    if(Number(A[i]) < Number(N)){
	      callback.fail(new Error(e_mesg));
	      return;
	    }
	  }
	  callback();
	});

}