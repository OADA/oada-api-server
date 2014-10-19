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

You may perform the OADA compliance at [oada-test.herokuapp.com/compliancy](https://oada-test.herokuapp.com/compliancy) by simply give it your API endpoint. The automated tester will test your API with the latest OADA specifications and report on the results. It takes about 5 seconds.

### Option B

You may clone, and modify the test and run them on your machine.

You must have [cucumber-js](https://github.com/cucumber/cucumber-js) installed.
All the dependencies for the tests are located inside [/cucumber](https://github.com/ssabpisa/oada-test/tree/master/cucumber).

If you wish to run the test against a different server, modify the server hostname value under 'root' here: `cucumber/support/config.js`
   
    exports.server = {
      root: "http://oada.yourhostname.com",
      finder: "bookmarks/machines/harvesters"
    }; 

If you do not change this parameter, the test will run against our [mock server](http://oada-test.herokuapp.com). 

**Performing the tests**

    cucumber-js cucumber

When you do this, it will perform all the tests located in `/cucumber/features` directory.
