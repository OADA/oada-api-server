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

/* GET home page. */
router.get('/', function(req, res) {
  res.send("<html><body style='background-color:#ebebeb;padding-top:45px;text-align:center'><div style='margin:auto'><img width='500' src='http://openag.io/img/oada-logo.svg'></div></body></html>")
});


router.post('/compliance/go/', function(req, res) {

	var appDir = path.dirname(require.main.filename).split("/");
	appDir.pop();
	var write_to = appDir.join("/") + "/" + "cucumber/features/support/_web_client.cfg";
	//Write _web_client config file so that the cucumber test knows that user is running from web
	fs.writeFileSync(write_to, JSON.stringify({
	    root: req.body.endpoint,
	    finder: "bookmarks/machines/harvesters",
	    token_key: req.body.token
	}));
	//run the test
	var raw = execSync('cucumber-js -f summary cucumber');
	//parse the result -- from the end of the report
	var run_results = raw.substr(-150);
	//look for the final result
	var re = /\d+ scenarios \(.*(\d+ failed).*(\d+ passed).*\)/g;
	var found = re.exec(run_results);
	//remove web_client cfg file since the test is finished
	fs.unlinkSync(write_to);
	//remove control characters and send to screen
	res.send(found[0].replace(/\[\d+m/g,""));
});

router.get('/compliance(/?)', function(req, res) {
	res.render('compliance',
	  { title : 'Home'}
	  )
});


module.exports = router;
