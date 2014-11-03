//Hook will run when a scenario finishes
var post_scenario_hook = function () {
  this.After(function(callback) {
  	//return control
    callback();
  });
};

module.exports = post_scenario_hook;
