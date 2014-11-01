/*
Copyright 2014 Open Ag Data Alliance

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var md5 = require('MD5');
// var execSync = require('exec-sync');

var exec = require('child_process').exec;

function toHtml(output_text){
	//TODO: move to helper func
	var red = function(t){
		return "<span style='color:#FF0000'>" + t  + "</span>";
	}
	var green = function(t){
		return "<span style='color:#1BAE1C'>" + t  + "</span>";
	}
	var bold = function(t){
		return "<strong>" + t + "</strong>";
	}
	return "<pre>" + output_text.replace(/Error/g,red(bold("Error")))
								.replace(/Missing attribute/g, red(bold('Missing attribute')))
								.replace(/Failing scenarios/g, red(bold("Failing scenarios")))
								.replace(/failed/g, red(bold("failed")))
								.replace(/Scenario/g, bold("> Scenario"))
								.replace(/passed/g, green(bold("passed"))) + "</pre>";
}

router.get('/', function(req, res) {
  res.redirect("/compliance");
});


router.post('/compliance/go/', function(req, res) {
	var testcases = ''; //prevent hijack
	try{
		testcases = req.body.testcases.join(" ").replace(/[;\n]+/g,";echo");
	}catch(ex){
		testcases = req.body.testcases.replace(/[;\n]+/g,";echo");	
	}
	var io = req.app.get('io');
	var appDir = path.dirname(require.main.filename).split("/");
	appDir.pop();
	var config_buffer = appDir.join("/") + "/" + "cucumber/features/support/_web_client.cfg";

	io.on('connection', function(socket){
	  socket.on('wait_file', function(msg){
	  		var rpt_name = md5(Math.random() + testcases) + ".html";
			var report_path = appDir.join("/") + "/" + "public/reports/" + rpt_name;
	
			//Write _web_client config file so that the cucumber
			//test knows that user is running from web temporary solution

			fs.writeFileSync(config_buffer, JSON.stringify({
			    root: req.body.endpoint,
			    bookmark: "bookmarks/machines/harvesters",
			    token_key: req.body.token
			}));

			var child = exec("cucumber-js -f pretty " + testcases + " | egrep -v '(\s+(at)\s).*'",
			  { 
			  	maxBuffer: 1073741824
			  },
			  function (error, stdout, stderr) {

			  	var slim_output = stdout.replace(/\[\d+m/g,"").replace(/(\s+(at)\s).*/g,"");
			    // fs.writeFileSync(report_path, toHtml(slim_output));

			    try{
			    	fs.unlinkSync(config_buffer);
			    }catch(ex){}

				io.emit('response_report', toHtml(slim_output));
			
			    if (error !== null) {
			      console.log('exec error: ' + error);
			      io.emit('response_report', "error");
			    }

			});
	    
	  });
	});

	
	res.render('compliance_wait')
});

router.get('/compliance(/?)', function(req, res) {
	res.render('compliance',
	  { title : 'OADA Test'}
	  )
});


module.exports = router;
