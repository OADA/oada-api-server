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

}