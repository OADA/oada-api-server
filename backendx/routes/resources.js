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

var express = require('express');
var router = express.Router();

/* GET resource listing. */
router.get('/:id', function(req, res) {

    //TODO: Check the Authentication Bearer
    var id = req.params.id;
    var formats_object = {};
    var meta_object = {};
    var data_resource_object = {
        "_href": "https://" + req.headers.host + "/resources/" + id + "/data"
    };

    if(id == 1236){
        //Get metadata for the “swath_width” stream
        formats_object["vnd.oada.harvester.streams.swath_width"] = {
            "original": true
        }
        meta_object["units"] = "feet";
    }

    var res_object = {
        "_href": "https://" + req.headers.host + "/resources/" + id,
        "_etag": "aabbccdd",
        "_changeId": "abcdef",
        "meta": meta_object,
        "formats": formats_object,
        "data": data_resource_object
    }


    res.json(res_object);
});

module.exports = router;
