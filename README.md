#OADA-Compliant API Server#

Notice: **All codes in repository are currently in pre-release alpha and are subject to changes.**

There is an example server running [here](http://oada-test.herokuapp.com). 

If you wish to run the API back-end on your own machine or server, you must install all the required packages by doing:
    
    cd  /path/to/this/project
    npm install
	
To start the API server:

    node bin/www

#API Testing#

To perform the tests, you must have [cucumber-js](https://github.com/cucumber/cucumber-js) installed.

If you wish to run the test on a different server, modify the server hostname here: `cucumber/support/world.js`
    
    this.root_url = "http://oada.yourapp.com"

**Performing the tests**

    cucumber-js cucumber/features/API.feature