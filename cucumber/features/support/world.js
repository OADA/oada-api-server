//Initialize your parameters here


var request = require('request')
var World = function World(callback) {
	this.lastResponse = null;
	var context = this;
	this.root_url = "http://localhost:3000"
	this.get_token = function(){
		return "123456";
	}
	this.get = function(uri, token, callback) {
		var header_object = {'User-Agent': 'request'}
		if(token != null){
			header_object['Authentication'] = 'Bearer ' + token;
		}
	    request.get({
	    			url: uri, 
	    			headers: header_object
	    		  },function(error, response) {
				      if (error) {
				        return callback.fail(new Error(error.message))
				      }
				      context.lastResponse = response;
				      console.log("GET Done");
				      callback()
				  });
  	}

  	this.post = function(uri, token, callback){
  		var header_object = {'User-Agent': 'request'}
		if(token != null){
			header_object['Authentication'] = 'Bearer ' + token;
		}
  		request({
  			url: uri,
  			body: requestBody,
  			method: "POST",
  			headers: header_object
  		}, function(error, response){
  			  if (error) {
		        return callback(new Error(error.message));
		      }
		      console.log(response);
			  callback();
  		});
  	}


    callback();
};

module.exports.World = World;
