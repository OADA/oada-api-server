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
