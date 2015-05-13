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

The config at the top of test/test-poc1.js currently points to localhost:3000, which is where the
mock server starts up locally.  If you want to test a different URL, change the config object
at the top of test/test-poc1.js to use the URL you want.

The early version of this server will attempt to respond verbatim with that listed in the
URL.  Later updates will make it a little smarter so that it responsed based on what
you've uploaded.

