var StepDef = function () {
  this.World = require("../support/world.js").World; 

  var context = this;
  this.Given(/^the client is logged in$/, function (callback) {
    //Check token validity somehow
    callback();
  });

  this.When(/^the client requests "([^"]*)" for "([^"]*)" that are "([^"]*)"$/, function (arg0, arg1, arg2, callback) {
    var url = this.root_url + "/" + arg0 + "/me/" + arg1 + "/" + arg2 + "/";
    console.log("Endpoint under test: " + url);
    this.get(url, this.get_token(), callback);
  });

  this.Then(/^the response is a resource with multiple machines entries organized by VIN$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    if(this.lastResponse.statusCode != 200){
      callback.fail(new Error("Failed"));
    }
    try{
      this.data_configs = JSON.parse(this.lastResponse.body);
      console.log("[PASSED] Configuration parsed");
    }catch(exp){
      callback.fail(new Error("Configurations JSON is malformed"));
    }
    //Test for multiple machines entries organized by VIN
    try{
      this.data_configs.resource;
      console.log("[PASSED] Found attribute `resource`");
    }catch(exp){
      callback.fail(new Error("Configurations missing attribute `resource`"));
    }

    //Iterate over resource and check (with Regular Expression)
    var vin_chk = new RegExp("[0-9]+[a-zA-Z]");
    for(var key in this.data_configs.resource){
      if(!vin_chk.test(key)){
        callback.fail(new Error("VIN is invalid: " + key));
      }else{
        console.log("[PASSED] VIN is valid: " + key);
      }
    }
    
    callback();
  });

  this.Then(/^each machine has the following attributes:$/, function (table, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^each meta attribute of each machine contains the following information:$/, function (table, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^each formats attribute of each machine is valid$/, function (callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

  this.Then(/^each data attributes of each machine are streams of the following resources:$/, function (table, callback) {
    // Write code here that turns the phrase above into concrete actions
    callback.pending();
  });

};

module.exports = StepDef;
