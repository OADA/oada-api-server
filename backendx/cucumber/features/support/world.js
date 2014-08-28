//Initialize your parameters here

var World = function World(callback) {
	this.get_token = function(){
		return "123456";
	}
	
	this.uri = "http://localhost:3000";

    callback();
};

module.exports.World = World;