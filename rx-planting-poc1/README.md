# OADA Prescription Planting Proof-Of-Concept #1
May 2015

This folder holds a mock server which responds to the URL's listed in
the technical spec.

* Tech spec: [https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0](https://drive.google.com/open?id=1Xz1jnfnTlubacFOh1qNjgJLSlcWMePyfmyPMfzYPbTw&authuser=0)
* Functional spec: [https://drive.google.com/open?id=1rfChm9UQB_PNIkE4Go89fDwryb4CCmGTwoOzzr58shU&authuser=0](https://drive.google.com/open?id=1rfChm9UQB_PNIkE4Go89fDwryb4CCmGTwoOzzr58shU&authuser=0)

To install:
```
git clone git@github.com:OADA/oada-demo-tests.git
cd oada-test/rx-planting-poc1
npm install
```

To run the mock server:
```
npm run start
```

To run the tests:
```
npm test
```

To run ONLY the bare-minimum tests for POC1:
```
mocha test/test-poc1.js
```

The config for the tests are at test/config.json.  Edit the URL in there to point to the OADA
implementation that you want to test.  other_configs has some alternate URL's that you can copy-paste
there (like the OADA demo server oon EC2).


