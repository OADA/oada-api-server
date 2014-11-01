#OADA-Compliant API Server#

Notice: ***All codes in repository are currently in pre-release alpha and are subject to changes.***

 There is an mock server running [here](http://oada-test.herokuapp.com). A good staring place is the harvesters configuration [/bookmarks/machines/harvesters](http://oada-test.herokuapp.com/bookmarks/machines/harvesters)

If you wish to run the API back-end on your own machine or server, you must install all the required packages by doing:
    
    cd  /path/to/this/project
    npm install
	
To start the API server:

    npm start

#API Testing#

### Option A

You may perform the OADA compliance check via [this web client](http://oada-test.herokuapp.com/compliance) by simply give it your API endpoint. The automated tester will test your API with the latest OADA specifications and report on the results. Depending on the latency of your API, it may takes anywhere from 5 seconds to 5 minutes.

You could also try Option B, if Option A takes too long.

### Option B

You may clone, modify the tests and run them on your machine.

You must have [cucumber-js](https://github.com/cucumber/cucumber-js) installed:

   npm install -g cucumber

All the dependencies for the tests are located inside [/cucumber](https://github.com/ssabpisa/oada-test/tree/master/cucumber).

If you wish to run the test against a different server, modify the server hostname value under 'root' here: `cucumber/features/support/config.js`
   
    exports.server = {
      root: "http://oada.yourhostname.com",
      bookmark: "bookmarks/machines/harvesters"
    }; 

If you do not change this parameter, the test will try to run against the local test server (localhost:3000) which you can start with the instructions above (npm start).

**Performing the tests**

    cucumber-js -f pretty cucumber

This will generate a color coded cucumber report, and a summary of passed/failed cases.
When you do this, it will perform all the tests located in `/cucumber/features` directory.

NOTE: if this fails with an error message about "superagent", try manually installing superagent with npm:

   npm install superagent
