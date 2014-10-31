var post_scenario_hook = function () {
  this.After(function(callback) {
    callback();
  });
};

module.exports = post_scenario_hook;
