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

//This is the document parser module for the API server

var md5 = require('MD5');
var docparser = function(root_url){
	this.root_url = "http://" + root_url;
}

docparser.prototype.parseTokens = function(doc){
	var temp = JSON.stringify(doc);
	temp = temp.replace(/<DOMAIN>/g, this.root_url);
	temp = temp.replace(/<Boolean>/g, "true"); //just hardcoded for demo purpose
	temp = temp.replace(/<Time>/g, new Date()); //just hardcoded for demo purpose


	temp = temp.replace(/<MD5>/g, md5(temp + Math.random()));

	return JSON.parse(temp);
};

module.exports = docparser;
