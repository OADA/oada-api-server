var StepDef = function () {
  this.World = require("../support/world.js").World; 

  var context = this;
  this.Given(/^the client is logged in$/, function (callback) {
    //Check token validity somehow
    callback();
  });

  this.When(/^the client requests "([^"]*)" for "([^"]*)" that are "([^"]*)"$/, function (arg0, arg1, arg2, callback) {
    this.current_url = this.root_url + "/" + arg0 + "/me/" + arg1 + "/" + arg2 + "/";
    console.log("Endpoint under test: " + this.current_url);
    this.get(this.current_url, this.get_token(), callback);
  });

  this.Then(/^the response is a resource with multiple machines entries organized by VIN$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    if(this.lastResponse.statusCode != 200){
      callback.fail(new Error("Failed"));
    }
    try{
      this.last_response = JSON.parse(this.lastResponse.body);
      console.log("[PASSED] Configuration parsed");
    }catch(exp){
      callback.fail(new Error("Configurations JSON is malformed"));
    }
    //Test for multiple machines entries organized by VIN
    try{
      this.last_response.resource;
      console.log("[PASSED] Found attribute `resource`");
    }catch(exp){
      callback.fail(new Error("Configurations missing attribute `resource`"));
    }

    //Check VINs look like VINs (with Regular Expression)
    var vin_chk = new RegExp("[0-9]+[a-zA-Z]");
    for(var key in this.last_response.resource){
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
    for(var machine_vin in this.last_response.resource){
        var machine_obj = this.last_response.resource[machine_vin];
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

  this.Then(/^each "([^"]*)" attribute of each machine contains the following information:$/, function (n1, table, callback) {
    for(var machine_vin in this.last_response.resource){
        var machine_obj = this.last_response.resource[machine_vin];
        for(var idx in table.rows()){
            var look_for = table.rows()[idx][0];
            if(machine_obj[n1][look_for] === undefined){
                callback.fail(new Error("Missing attribute :" + look_for + " @" + this.current_url));
            }else{
                console.log("[PASSED] Harvester attribute check : " + machine_vin  + "/" + look_for);
            }
        }
    }
    callback();
  });

  this.Then(/^each "([^"]*)" attributes of each machine are "([^"]*)" of the following resources:$/, function (n1, n2, table, callback) {
    for(var machine_vin in this.last_response.resource){
        var machine_obj = this.last_response.resource[machine_vin];
        for(var idx in table.rows()){
            var look_for = table.rows()[idx][0];
            if(machine_obj[n1][n2][look_for] === undefined){
                callback.fail(new Error("Missing attribute :" + look_for + " @" + this.current_url));
            }else{
                console.log("[PASSED] Harvester attribute check : " + machine_vin  + "/" + look_for);
            }
        }
    }
   callback();
  });

};

module.exports = StepDef;
