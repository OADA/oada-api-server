var fs = require('fs');
 //if we are running the test through web client, it will write the URL and token_key to here
var chkpath = __dirname + "/" + "_web_client.cfg";
var user_confg = require('./config');

var muxed_config = user_confg.server;

if (fs.existsSync(chkpath)) {
	//if user is running the web client version
	//load that configuration
    muxed_config = JSON.parse(fs.readFileSync(chkpath));
}

exports.server = muxed_config;