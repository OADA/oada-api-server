var md5 = require('MD5');
var docparser = function(root_url){
	this.root_url = "http://" + root_url;
}
docparser.prototype.parseTokens = function(doc){
	var temp = JSON.stringify(doc);
	temp = temp.replace(/<URI>/g, this.root_url);
	temp = temp.replace(/<Boolean>/g, "true"); //just hardcoded for demo purpose
	temp = temp.replace(/<Time>/g, new Date()); //just hardcoded for demo purpose


	temp = temp.replace(/<ETAG>/g, md5(temp + Math.random()));
	return JSON.parse(temp);
};

module.exports = docparser;