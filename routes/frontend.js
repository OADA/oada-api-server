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
var fs = require('fs');
// var execSync = require('exec-sync');


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
	
	res.render('compliance_wait', {'tests': testcases, 
								   'token': req.body.token, 
								   'endpoint': req.body.endpoint})
});

router.get('/compliance(/?)', function(req, res) {
	res.render('compliance',
	  { title : 'OADA Test'}
	  )
});


module.exports = router;
