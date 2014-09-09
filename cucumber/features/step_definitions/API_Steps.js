function check_attributes(table, object, passing_callback){
      /*
        check if all attributes specified in table exists in object
        @table : attribute table passed via cucumber
        @object: object to be tested
      */
      for(var idx in table.rows()){
            var look_for = table.rows()[idx][0];
            if(object[look_for] === undefined){
                callback.fail(new Error("Missing attribute :" + look_for + " @" + this.current_url));
                return;
            }else{
                passing_callback();
            }
      }
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
    console.log("Endpoint under test: " + this.current_url);
    this.get(this.current_url, this.get_token(), callback);
  });

  this.Then(/^the response is a resource with multiple machines entries organized by VIN$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    if(this.lastResponse.statusCode != 200){
      callback.fail(new Error("Failed"));
    }
    try{
      //TODO : rename last_response to response_object or something
      this.last_response = JSON.parse(this.lastResponse.body);
      console.log("[PASSED] Configuration parsed");
    }catch(exp){
      callback.fail(new Error("Configurations JSON is malformed"));
    }
    //Test for multiple machines entries organized by VIN
    if(this.last_response.items !== undefined){
      this.last_response.items;
      console.log("[PASSED] Found attribute `items`");
    }else{
      callback.fail(new Error("Configurations missing attribute `items`"));
    }

    //Check VINs look like VINs (with Regular Expression)
    var vin_chk = new RegExp("[0-9]+[a-zA-Z]");
    for(var key in this.last_response.items){
      if(!vin_chk.test(key)){
        callback.fail(new Error("VIN looks wrong: " + key));
      }else{
        console.log("[PASSED] VIN looks ok: " + key);
      }
    }
    
    callback();
  });

  this.Then(/^each machine has the following attributes:$/, function (table, callback) {
    // Write code here that turns the phrase above into concrete actions
    for(var machine_vin in this.last_response.items){
        var machine_obj = this.last_response.items[machine_vin].resource;
        for(var idx in table.rows()){
            var look_for = table.rows()[idx][0];
            if(machine_obj[look_for] === undefined){
                callback.fail(new Error("Missing attribute :" + look_for + " @" + this.current_url));
            }else{
                console.log("[PASSED] Harvester attribute check : " + machine_vin  + "/" + look_for);
            }
        }
    }
    
    callback();
  });
  
  
  this.Then(/^the "([^"]*)" attribute of each machine contains the following information:$/, function (n1, table, callback) {
    var msg_success = function(){
       console.log("[PASSED] Harvester attribute check : " + machine_vin  + "/" + look_for);
    }
    for(var machine_vin in this.last_response.resource){
        var machine_obj = this.last_response.resource[machine_vin];
        var machine_obj_meta = machine_obj.meta;
        check_attributes(table, machine_obj, msg_success);
    }
    callback();
  });


  this.When(/^the client requests resource number "([^"]*)"$/, function (arg1, callback) {   
      //Test Geofence resource
      this.current_url = this.root_url + "/" + "resources/" + arg1 ;
      console.log("Endpoint under test: " + this.current_url);
      this.get(this.current_url, this.get_token(), callback);                                                                                                         
  });                                                                                                                             
                                                                                                                                    
  this.Then(/^the response is a resource with the following information:$/, function (table, callback) {                          
      try{
        this.last_response = JSON.parse(this.lastResponse.body);
      }catch(ex){
        callback.fail(new Error("JSON is malformed " + " @" + this.current_url));
      }
      for(var idx in table.rows()){
          var look_for = table.rows()[idx][0];
          if(this.last_response[look_for] === undefined){
              callback.fail(new Error("Geofence Resource missing attribute :" + look_for + " @" + this.current_url));
          }else{
              console.log("[PASSED] Geofence Resource attribute check : " + look_for);
          }
      }
      callback();
  });                                                                                                                             
                                                                                                                                    
  this.Then(/^each item has the following information:$/, function (table, callback) {                                       
      callback.pending();                                                                                                      
  });                                                                                                                             
            
  this.When(/^the client requests a geofence stream for harvester with VIN "([^"]*)"$/, function (arg1, callback) {   
      callback.pending();      
  });                                                                                                                             

  this.When(/^the client requests a swath_width stream for harvester with VIN "([^"]*)"$/, function (arg1, callback) {   
      callback.pending();      
  });                                                                                                                             


};

module.exports = StepDef;
