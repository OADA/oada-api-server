/*
# Copyright 2014 Open Ag Data Alliance
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
*/

var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var execSync = require('exec-sync');

// var exec = require('child_process').exec;

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
  res.redirect("/bookmarks/machines/harvesters/");
});


router.post('/compliance/go/', function(req, res) {

	var appDir = path.dirname(require.main.filename).split("/");
	appDir.pop();
	var config_buffer = appDir.join("/") + "/" + "cucumber/features/support/_web_client.cfg";
	var report_path = appDir.join("/") + "/" + "public/report.html";

	//Write _web_client config file so that the cucumber test knows that user is running from web
	//temporary solution
	fs.writeFileSync(config_buffer, JSON.stringify({
	    root: req.body.endpoint,
	    finder: "bookmarks/machines/harvesters",
	    token_key: req.body.token
	}));

	//run the test
	var raw = execSync("cucumber-js -f pretty cucumber/features/ | egrep -v '(\s+(at)\s).*'");

	//TODO: Asynchronous version

	// child = exec('cucumber-js -f pretty cucumber/features/fields.feature',
	//   {maxBuffer: 1073741824},
	//   function (error, stdout, stderr) {
	//     console.log('stdout: ' + stdout);
	//     console.log('stderr: ' + stderr);
	//     if (error !== null) {
	//       console.log('exec error: ' + error);
	//     }
	// });

	//parse the result -- from the end of the report
	var run_results = raw;
	
  	//remove web_client cfg file since the test is finished
	fs.unlinkSync(config_buffer);
	
	var slim_output = "Error occurred while parsing the report.";
	try{
		//remove control characters and send to screen
		//remove stack trace
		slim_output = run_results.replace(/\[\d+m/g,"").replace(/(\s+(at)\s).*/g,"");
	}catch(ex){
		console.log(ex);
		res.send("We think there is something wrong with the URL, or the token you provided. Please try again.");
	}

	// fs.writeFileSync(report_path, toHtml(slim_output));

	res.send(toHtml(slim_output));
});

router.get('/compliance(/?)', function(req, res) {
	res.render('compliance',
	  { title : 'OADA Test'}
	  )
});


module.exports = router;
