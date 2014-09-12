#OADA-Compliant API Server#

Notice: ***All codes in repository are currently in pre-release alpha and are subject to changes.***

There is an example server running [here](http://oada-test.herokuapp.com). A good staring place is the harvesters configuration [/configuration/me/machines/harvesters](http://oada-test.herokuapp.com/configurations/me/machines/harvesters?_expand=2)

If you wish to run the API back-end on your own machine or server, you must install all the required packages by doing:
    
    cd  /path/to/this/project
    npm install
	
To start the API server:

    node bin/www

#API Testing#

To perform the tests, you must have [cucumber-js](https://github.com/cucumber/cucumber-js) installed.

If you wish to run the test on a different server, modify the server hostname here: `cucumber/support/world.js`
    
    var configurations = {
         "hostname": "http://your.hostname.com"
	}

If you do not change this parameter, the test will run against our [test server](http://oada-test.herokuapp.com). 

**Performing the tests**

    cucumber-js -f pretty cucumber

When you do this, it will perform all the tests located in `/cucumber/features` directory.


#Modifying the testcases#

Follow the standard [cucumber-js](https://github.com/cucumber/cucumber-js) procedures to add more tests. Take a look at Cucumber's wiki [here](https://github.com/cucumber/cucumber/wiki) to see how tests can be written or modified.

Our main test is specified by the `Demo.feature` file under the `/cucumber/features` directory. 
