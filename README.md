#OADA-Compliant API Server#

OADA Sample API Backend **(/backendx)**, with Gherkin Cucumber Tests **(/cucumber)**

Running the API server:

> `node backendx/bin/www`

#Cucumber Test#

Specify your hostname in `cucumber/support/world.js`
    
    this.root_url = "http://oada.yourapp.com"

**Performing the tests**

> `cucumber-js cucumber/features/API.feature`

