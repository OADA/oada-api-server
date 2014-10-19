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

/* GET home page. */
router.get('/', function(req, res) {
  res.send("<html><body style='background-color:#ebebeb;padding-top:45px;text-align:center'><div style='margin:auto'><img width='500' src='http://openag.io/img/oada-logo.svg'></div></body></html>")
});


router.get('/compliance(/?)', function(req, res) {
	res.render('index',
	  { title : 'Home' }
	  )
});

module.exports = router;
