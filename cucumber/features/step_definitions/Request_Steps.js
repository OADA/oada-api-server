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


  this.When(/^the client requests the "([^"]*)" bookmark ([A-Za-z]*) view parameter( ?[A-Za-z_0-9]*)?$/, 
    function (bk_name, view_state, parameter_filename, callback) {

     if (typeof parameter_filename !== 'undefined') {
       parameter_filename = parameter_filename.replace(" ",""); // strip any leading spaces
     }

     var has_view_parameter = (view_state == "with" ? 1 : 0);

     this.current_url = this.root_url + "/bookmarks/" +  bk_name;
     if(has_view_parameter){
        var VIEW_PARAM = JSON.stringify(require("../support/view_parameters/" + parameter_filename +  ".json"));
        this.current_url += "?view=" + encodeURIComponent(VIEW_PARAM);
        console.log("Using View: " + VIEW_PARAM);

     }

     console.log("Fetching " + this.current_url);
     var that = this;
     this.get(this.current_url, this.get_token(), callback);
  });


  this.Then(/^each resource document for with id "([^"]*)" contains at least the following information:$/, function (jsonpath, table, callback) {
    
    var target = this.walker.eval(this.last_response, jsonpath);
    if(target === undefined || target == null){
          callback.fail(new Error("Unable to map " + jsonpath));
    }

    var passcount = 0;
    for(var i in target){
        var _id = target[i];
        var that = this;
        this.current_url = this.root_url + "/" + "resources" + "/" + _id;
        this.get(this.current_url, this.get_token(), function(){
            var res = that.check_jp_attr(table, that.last_response);
            if(!res.passed){
              callback.fail(res.E);
            }else{
              passcount++;
            }

            if(passcount == target.length){
              callback();
            }
        });
    }
    
  });


  this.When(/^the client requests a "([^"]*)" stream for harvester with identifier "([^"]*)" ([^"]*) view parameter ([A-Za-z0-9_]+)$/,
      function (what_stream, vin, view_state, parameter_filename, callback) {

    var has_view_parameter = (view_state == "with" ? 1 : 0);
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
            if(has_view_parameter){
              var VIEW_PARAM = JSON.stringify(require("../support/view_parameters/" + parameter_filename +  ".json"));
              datalink += "?view=" + encodeURIComponent(VIEW_PARAM);
              console.log("Using View: " + VIEW_PARAM);
            }

            console.log("Fetching final resource: " + datalink);

            that.current_url = just_data_url;  
              that.get(datalink, that.get_token(), kallback);
      });
    });
    this.current_model = null;
  });
}
