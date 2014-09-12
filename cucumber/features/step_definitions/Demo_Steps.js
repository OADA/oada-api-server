function check_attributes(table, object, passing_callback, callback){
      /*
        check if all attributes specified in table exists in object
        @table : attribute table [PASSED]  via cucumber
        @object: object to be tested
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
  /*
    given a path string (ie. foo/bar)
    return the node at root->foo->bar

    @jsonpath : see example
    @root: the root object  
  */
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
  this.World = require("../support/world.js").World; 

  var context = this;
  this.Given(/^the client is logged in$/, function (callback) {
    //Check token validity somehow
    callback();
  });
  
  this.Given(/^the client is authorized$/, function (callback) {
    //Check token validity somehow
    callback();
  });

  this.When(/^the client requests "([^"]*)" for "([^"]*)" that are "([^"]*)"$/, function (arg0, arg1, arg2, callback) {
      this.current_url = this.root_url + "/" + arg0 + "/me/" + arg1 + "/" + arg2 + "?_expand=2";
      this.get(this.current_url, this.get_token(), callback);
      this.current_model = null;
      console.log("Endpoint: " + this.current_url);
  });


  this.Then(/^the response is a "([^"]*)"$/, function (model_name, callback) {
    // This step tells the parser what response model to use/expect in
    // subsequent tests 
    this.current_model = this.models[model_name];
    try{
      this.last_response = JSON.parse(this._lastResponse.body);
    }catch(ex){
      console.log(this._lastResponse)
    }

    console.log("Expecting a " + model_name + " back");
    callback();
  });


  this.Then(/^each "([^"]*)" has the following attributes:$/, function (arg1, table, callback) {
    var object = getNode(this.current_model.vocabularies[arg1].jsonpath, 
                         this.last_response);
    var result = check_attributes(table, object, function(key){
      console.log("[PASSED]  - Attribute Check for : " + arg1 + "/" + key);
    });
    if(!result) callback.fail(new Error("Failed - Attribute Check for: " + arg1));
    
    callback();
  });


  this.Then(/^the "([^"]*)" attribute of each "([^"]*)" contains the following information:$/, function (arg1, arg2, table, callback) {
    var iter = 0;
    do{
       var object = getNode(this.current_model.vocabularies[arg2].jsonpath, 
                         this.last_response, 
                         iter++);

       if(object == null) break;

       object = object[arg1]; 

       var result = check_attributes(table, object, function(key){
         console.log("[PASSED]  - Attribute Check* for : " + arg2 + "/" + arg1 + "/" + key);
       });

       if(!result) callback.fail(new Error("Failed - Attribute Check for: " + arg1));


    }while(object != null);
    callback();
  });

  this.Then(/^the "([^"]*)" attribute contains the following information:$/, function (arg1, table, callback) {
       var object = getNode(this.current_model.vocabularies[arg1].jsonpath, 
                         this.last_response, 
                         0);
       var result = check_attributes(table, object, function(key){
         console.log("[PASSED]  - Attribute Check for : " + arg1  + "/" + key);

       });
       if(!result) callback.fail(new Error("Failed - Attribute Check for: " + arg1));
       callback();
  });


  this.When(/^the client requests a "([^"]*)" stream for harvester with VIN "([^"]*)"$/, function (arg1, arg2, callback) {
    /*
      Obtain the requested stream link from configuration document
    */

    this.current_url = this.root_url + "/configurations/me/machines/harvesters?_expand=2";
    var that = this;
    var kallback = callback;
    this.get(this.current_url, this.get_token(), function(){
      var configobj = JSON.parse(that._lastResponse.body);
      var streamlink = configobj.items[arg2].resource.data.streams[arg1]._href;
      
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

  this.Then(/^the "([^"]*)" attribute contains (\d+) or more item$/, function (arg1, arg2, callback) {
    //TODO: give suggestion that you maybe missing entry in the vocab definition
    var object = getNode(this.current_model.vocabularies[arg1].jsonpath, 
                         this.last_response, 
                         0);

    //TODO: items API format is {0:A, 1:B, 2:C}
    if(Number(object.length) < Number(arg2)){
      callback.fail(new Error("The property " + arg1 + " must be iterable and have 0 more 1 items inside."));
    }
    console.log("[PASSED]  - " + arg1 + " contains 0 or more items.");
    callback();
  });

  this.Then(/^each item in "([^"]*)" has the following information:$/, function (arg1, table, callback) {
    var iterable = getNode(this.current_model.vocabularies[arg1].jsonpath, 
                         this.last_response, 
                         0);
    for(var key in iterable){
      var object = iterable[key];
      if(!check_attributes(table, object, function(key){
        console.log("[PASSED]  - Item Attribute Check for : resource/" + key + ".");
      })){ callback.fail(new Error("Failed - Item Attribute Check for: " + arg1)); }
    }
    callback();
  });

};

module.exports = StepDef;
